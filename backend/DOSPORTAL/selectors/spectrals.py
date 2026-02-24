from DOSPORTAL.models.spectrals import SpectralRecord


def spectral_records_visible(user=None):
    """
    Return all non-deleted spectral records whose organization is also not deleted.
    Optionally filter to a specific user's accessible records.
    """
    if user is not None:
        from DOSPORTAL.models import OrganizationUser

        user_orgs = OrganizationUser.objects.filter(
            user=user,
            user_type__in=["OW", "AD", "ME"],
        ).values_list("organization_id", flat=True)

        return (
            SpectralRecord.objects.filter(owner__in=user_orgs, owner__is_deleted=False)
            | SpectralRecord.objects.filter(author=user)
        ).distinct()

    return SpectralRecord.objects.filter(owner__is_deleted=False) | SpectralRecord.objects.filter(owner__isnull=True)
