from DOSPORTAL.models import File


def files_visible(user=None):
    """
    Return all non-deleted files whose organization is also not deleted.
    Optionally filter to a specific user's accessible files.
    """
    if user is not None:
        from DOSPORTAL.models import OrganizationUser

        user_orgs = OrganizationUser.objects.filter(
            user=user,
            user_type__in=["OW", "AD", "ME"],
        ).values_list("organization_id", flat=True)

        return (
            File.objects.filter(owner__in=user_orgs, owner__is_deleted=False)
            | File.objects.filter(author=user)
        ).distinct()

    return File.objects.filter(owner__is_deleted=False) | File.objects.filter(owner__isnull=True)
