from rest_framework.permissions import BasePermission, SAFE_METHODS

from DOSPORTAL.models import OrganizationUser


class IsOrganizationMember(BasePermission):
    """
    User must be a member (OW, AD, ME) of the organization
    identified by 'org_id' in URL kwargs.
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        org_id = view.kwargs.get("org_id")
        if not org_id:
            return False
        return OrganizationUser.objects.filter(
            user=request.user,
            organization_id=org_id,
            user_type__in=["OW", "AD", "ME"],
        ).exists()

    @staticmethod
    def user_is_member(user, org):
        """Check if user is a member (OW/AD/ME) of the given org object."""
        return OrganizationUser.objects.filter(
            user=user,
            organization=org,
            user_type__in=["OW", "AD", "ME"],
        ).exists()


class IsOrganizationAdmin(BasePermission):
    """
    User must be an admin or owner (OW, AD) of the organization
    identified by 'org_id' in URL kwargs.
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        org_id = view.kwargs.get("org_id")
        if not org_id:
            return False
        return OrganizationUser.objects.filter(
            user=request.user,
            organization_id=org_id,
            user_type__in=["OW", "AD"],
        ).exists()

    @staticmethod
    def user_is_admin(user, org):
        """Check if user is an admin or owner (OW/AD) of the given org object."""
        return OrganizationUser.objects.filter(
            user=user,
            organization=org,
            user_type__in=["OW", "AD"],
        ).exists()


class IsOrganizationAdminOrReadOnly(BasePermission):
    """
    Read-only (safe) methods are allowed to any authenticated user.
    Write methods require OW/AD of the organization in URL kwargs.
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        org_id = view.kwargs.get("org_id")
        if not org_id:
            return False
        return OrganizationUser.objects.filter(
            user=request.user,
            organization_id=org_id,
            user_type__in=["OW", "AD"],
        ).exists()
