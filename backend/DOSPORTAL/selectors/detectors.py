from DOSPORTAL.models.detectors import Detector


def detectors_visible(user=None):
    """
    Return all non-deleted detectors whose organization is also not deleted.
    Optionally filter to a specific user's accessible detectors.
    """
    if user is not None:
        from DOSPORTAL.models import OrganizationUser

        user_orgs = OrganizationUser.objects.filter(
            user=user,
            user_type__in=["OW", "AD", "ME"],
        ).values_list("organization_id", flat=True)

        return Detector.objects.filter(
            owner__in=user_orgs,
            owner__is_deleted=False,
        ).distinct()

    return Detector.objects.filter(owner__is_deleted=False)
