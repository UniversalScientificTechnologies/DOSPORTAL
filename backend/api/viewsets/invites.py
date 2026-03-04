from django.db import transaction
from django.utils import timezone

from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from drf_spectacular.utils import extend_schema, extend_schema_view

from DOSPORTAL.models import OrganizationInvite, OrganizationUser
from ..serializers import OrganizationDetailSerializer


@extend_schema_view(
    retrieve=extend_schema(
        description="Get invite details by token (public, no authentication required).",
        tags=["Organizations"],
    ),
)
class InviteViewSet(RetrieveModelMixin, GenericViewSet):

    lookup_field = "token"
    permission_classes = [AllowAny]

    def get_queryset(self):
        return OrganizationInvite.objects.select_related("organization").all()

    def get_object(self):
        token = self.kwargs["token"]
        token_hash = OrganizationInvite.hash_token(token)
        try:
            return OrganizationInvite.objects.select_related("organization").get(
                token_hash=token_hash
            )
        except OrganizationInvite.DoesNotExist:
            raise NotFound("Invalid invite token.")

    def retrieve(self, request, *args, **kwargs):
        invite = self.get_object()
        org_data = OrganizationDetailSerializer(invite.organization).data
        return Response(
            {
                "organization": org_data,
                "user_type": invite.user_type,
                "expires_at": invite.expires_at,
                "is_active": invite.is_active,
            }
        )

    @extend_schema(
        description="Accept an invite and join the organization. Requires authentication.",
        tags=["Organizations"],
        responses={200: {"description": "Successfully joined the organization"}},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="accept",
        permission_classes=[IsAuthenticated],
    )
    def accept(self, request, token=None):
        token_hash = OrganizationInvite.hash_token(token)
        try:
            with transaction.atomic():
                invite = OrganizationInvite.objects.select_for_update().get(
                    token_hash=token_hash
                )
                if not invite.is_active:
                    return Response(
                        {"detail": "Invite is not active (expired, used, or revoked)."},
                        status=400,
                    )
                if OrganizationUser.objects.filter(
                    user=request.user, organization=invite.organization
                ).exists():
                    return Response(
                        {"detail": "You are already a member of this organization."},
                        status=400,
                    )
                OrganizationUser.objects.create(
                    user=request.user,
                    organization=invite.organization,
                    user_type=invite.user_type,
                )
                invite.used_at = timezone.now()
                invite.used_by = request.user
                invite.save()
                return Response(
                    {
                        "detail": "Joined.",
                        "organization_id": str(invite.organization.id),
                        "user_type": invite.user_type,
                    },
                    status=200,
                )
        except OrganizationInvite.DoesNotExist:
            return Response({"detail": "Invalid invite token."}, status=404)
