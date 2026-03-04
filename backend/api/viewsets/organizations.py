from django.contrib.auth.models import User as DjangoUser
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from DOSPORTAL.models import Organization, OrganizationUser, OrganizationInvite
from ..serializers import (
    OrganizationDetailSerializer,
    OrganizationInviteSerializer,
)
from ..permissions import IsOrganizationAdmin, IsOrganizationMember
from ..viewsets_base import SoftDeleteModelViewSet


@extend_schema_view(
    list=extend_schema(
        description="List all organizations (any authenticated user).",
        tags=["Organizations"],
    ),
    create=extend_schema(
        description="Create a new organization. The creator automatically becomes owner.",
        tags=["Organizations"],
    ),
    retrieve=extend_schema(
        description="Get organization detail by ID.",
        tags=["Organizations"],
    ),
    update=extend_schema(
        description="Update organization (owner/admin only).",
        tags=["Organizations"],
    ),
    partial_update=extend_schema(
        description="Partially update organization (owner/admin only).",
        tags=["Organizations"],
    ),
    destroy=extend_schema(
        description="Soft-delete an organization (owner/admin only).",
        tags=["Organizations"],
    ),
    members=extend_schema(
        description="GET: List all members. POST: Add a member (admin/owner only).",
        tags=["Organizations"],
    ),
    member_detail=extend_schema(
        description="PUT: Update a member's role (admin/owner only). DELETE: Remove a member.",
        tags=["Organizations"],
    ),
    invites=extend_schema(
        description="GET: List organization invites (admin/owner only). POST: Create a new invite (admin/owner only).",
        tags=["Organizations"],
    ),
    revoke_invite=extend_schema(
        description="Revoke an active invite by its UUID (admin/owner only).",
        tags=["Organizations"],
    ),
)
class OrganizationViewSet(SoftDeleteModelViewSet):

    serializer_class = OrganizationDetailSerializer
    # Keeps 'org_id' as URL kwarg so IsOrganizationAdmin permission class works.
    lookup_url_kwarg = "org_id"

    def get_queryset(self):
        return Organization.objects.all()

    def get_permissions(self):
        admin_actions = (
            "update", "partial_update", "destroy",
            "invites", "revoke_invite",
        )
        if self.action in admin_actions:
            return [IsAuthenticated(), IsOrganizationAdmin()]
        if self.action == "member_detail":
            # DELETE: any member can remove themselves; admin required for others
            # PUT: admin required — but IsOrganizationMember gates entry, admin check is in the view
            return [IsAuthenticated(), IsOrganizationMember()]
        if self.action == "members" and self.request.method == "POST":
            return [IsAuthenticated(), IsOrganizationAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        org = serializer.save()
        OrganizationUser.objects.create(
            user=self.request.user, organization=org, user_type="OW"
        )

    # ------------------------------------------------------------------ members

    @action(detail=True, url_path="members", methods=["get", "post"])
    def members(self, request, org_id=None):
        org = self.get_object()

        if request.method == "GET":
            org_users = OrganizationUser.objects.filter(
                organization=org
            ).select_related("user")
            data = [
                {
                    "id": ou.user.id,
                    "username": ou.user.username,
                    "first_name": ou.user.first_name,
                    "last_name": ou.user.last_name,
                    "user_type": ou.user_type,
                }
                for ou in org_users
            ]
            return Response(data)

        # POST — add member (IsOrganizationAdmin already enforced)
        username = request.data.get("username")
        user_type = request.data.get("user_type", "ME")
        if not username:
            return Response({"detail": "Username required."}, status=400)
        if user_type not in ["ME", "AD"]:
            return Response({"detail": "Invalid user_type. Only ME or AD allowed."}, status=400)
        try:
            user = DjangoUser.objects.get(username=username)
        except DjangoUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)
        if OrganizationUser.objects.filter(user=user, organization=org).exists():
            return Response({"detail": "User already a member."}, status=400)
        OrganizationUser.objects.create(user=user, organization=org, user_type=user_type)
        return Response({"detail": "User added."}, status=201)

    @action(
        detail=True,
        url_path=r"members/(?P<username>[^/.]+)",
        methods=["put", "delete"],
    )
    def member_detail(self, request, org_id=None, username=None):
        org = self.get_object()
        try:
            target_user = DjangoUser.objects.get(username=username)
        except DjangoUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        if request.method == "PUT":
            # Admin/owner only (checked via get_permissions + explicit guard)
            if not IsOrganizationAdmin.user_is_admin(request.user, org):
                return Response({"detail": "You do not have permission to change roles."}, status=403)
            user_type = request.data.get("user_type", "ME")
            if user_type not in ["ME", "AD"]:
                return Response({"detail": "Invalid role."}, status=400)
            org_member = OrganizationUser.objects.filter(
                user=target_user, organization=org
            ).first()
            if not org_member:
                return Response(
                    {"detail": "User is not a member of this organization."}, status=404
                )
            org_member.user_type = user_type
            org_member.save()
            return Response({"detail": f"Role updated to {user_type}."}, status=200)

        # DELETE — any member can remove themselves; admin required for others
        if target_user != request.user and not IsOrganizationAdmin.user_is_admin(
            request.user, org
        ):
            return Response(
                {"detail": "You do not have permission to remove this member."},
                status=403,
            )
        org_member = OrganizationUser.objects.filter(
            user=target_user, organization=org
        ).first()
        if not org_member:
            return Response(
                {"detail": "User is not a member of this organization."}, status=404
            )
        if org_member.user_type == "OW":
            return Response(
                {"detail": "You cannot remove the owner from the organization."},
                status=403,
            )
        org_member.delete()
        return Response({"detail": "User removed from organization."}, status=200)

    # ------------------------------------------------------------------ invites

    @action(detail=True, url_path="invites", methods=["get", "post"])
    def invites(self, request, org_id=None):
        org = self.get_object()

        if request.method == "GET":
            org_invites = OrganizationInvite.objects.filter(
                organization=org
            ).order_by("-created_at")
            serializer = OrganizationInviteSerializer(org_invites, many=True)
            return Response(serializer.data)

        # POST — create invite
        user_type = request.data.get("user_type", "ME")
        expires_hours = int(request.data.get("expires_hours", 24))
        expires_hours = min(max(expires_hours, 1), 168)
        if user_type not in ["ME", "AD"]:
            return Response({"detail": "Invalid user_type."}, status=400)
        token = OrganizationInvite.generate_token()
        token_hash = OrganizationInvite.hash_token(token)
        expires_at = timezone.now() + timezone.timedelta(hours=expires_hours)
        invite = OrganizationInvite.objects.create(
            organization=org,
            token_hash=token_hash,
            user_type=user_type,
            created_by=request.user,
            expires_at=expires_at,
        )
        invite_url = f"/invite/{token}/"
        return Response(
            {
                "invite_url": invite_url,
                "expires_at": invite.expires_at,
                "user_type": invite.user_type,
            },
            status=201,
        )

    @action(
        detail=True,
        url_path=r"invites/(?P<invite_id>[^/.]+)",
        methods=["delete"],
    )
    def revoke_invite(self, request, org_id=None, invite_id=None):
        org = self.get_object()
        try:
            invite = OrganizationInvite.objects.get(id=invite_id, organization=org)
        except OrganizationInvite.DoesNotExist:
            return Response({"detail": "Invite not found."}, status=404)
        if not invite.is_active:
            return Response({"detail": "Invite is already inactive."}, status=400)
        invite.revoked_at = timezone.now()
        invite.save(update_fields=["revoked_at"])
        return Response({"detail": "Invite revoked."}, status=200)
