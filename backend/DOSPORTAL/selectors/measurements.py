from DOSPORTAL.models import Measurement, MeasurementSegment


def measurements_visible(user=None):
    """
    Return all non-deleted measurements whose organization is also not deleted.
    Optionally filter to a specific user's accessible measurements.
    """
    qs = (
        Measurement.objects.filter(
            owner__is_deleted=False,
        )
        | Measurement.objects.filter(owner__isnull=True)
    ).distinct()

    if user is not None:
        from DOSPORTAL.models import OrganizationUser

        user_orgs = OrganizationUser.objects.filter(
            user=user,
            user_type__in=["OW", "AD", "ME"],
        ).values_list("organization_id", flat=True)

        qs = (
            Measurement.objects.filter(owner__in=user_orgs, owner__is_deleted=False)
            | Measurement.objects.filter(author=user)
        ).distinct()

    return qs


def measurement_segments_visible():
    return MeasurementSegment.objects.filter(
        measurement__is_deleted=False,
    )
