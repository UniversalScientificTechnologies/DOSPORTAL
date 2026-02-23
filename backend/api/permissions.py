"""Shared permission helpers for API views."""

from DOSPORTAL.models import OrganizationUser


def check_org_admin_permission(user, org):
    """
    Check if user is admin or owner of the organization.
    Returns (has_permission: bool, org_user: OrganizationUser|None)
    """
    org_user = OrganizationUser.objects.filter(user=user, organization=org).first()
    has_permission = org_user and org_user.user_type in ["OW", "AD"]
    return has_permission, org_user
