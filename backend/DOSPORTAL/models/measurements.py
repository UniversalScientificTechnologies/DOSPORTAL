from django.contrib.gis.db import models as geomodels
from django.db import models
from django.conf import settings
from django.urls import reverse
from django.utils.translation import gettext as _
from django.contrib.postgres.fields import ArrayField
from ..models.utils import UUIDMixin
from martor.models import MartorField
from DOSPORTAL.services.file_validation import validate_uploaded_file
from .flights import Flight
from .files import File

def _validate_log_file(uploaded_file):
    return validate_uploaded_file(
        uploaded_file,
        allowed_extensions=[
            ".log",
            ".txt",
            ".csv",
            ".json",
        ],  # TODO adjust values as neeeded
        max_size_mb=50,
    )


def _validate_data_file(uploaded_file):
    return validate_uploaded_file(
        uploaded_file,
        allowed_extensions=[
            ".csv",
            ".json",
            ".txt",
            ".bin",
        ],  # TODO adjust values as neeeded
        max_size_mb=200,
    )


def _validate_metadata_file(uploaded_file):
    return validate_uploaded_file(
        uploaded_file,
        allowed_extensions=[
            ".json",
            ".yaml",
            ".yml",
            ".csv",
        ],  # TODO adjust values as neeeded
        max_size_mb=20,
    )

class MeasurementDataFlight(UUIDMixin):
    flight = models.ForeignKey(
        Flight, on_delete=models.CASCADE, related_name="measurements"
    )


class MeasurementCampaign(UUIDMixin):

    name = models.CharField(
        _("measurement name"), max_length=150, null=True, blank=True
    )

    def __str__(self) -> str:
        return "Campaign: {}".format(self.name)


class Measurement(UUIDMixin):
    """
    Měřením se rozumí sada zaznamů (record), které analyzují jednu a tu samou věc a jsou změřeny jedním detektorem.
    Pokud jsou v latedle dva detektory, tak to jsou dvě měření. Pokud je ale záznam z jednoho detektoru
    přerušen a navázán novým záznamem, tak to je celé jedno měření.

    """

    time_start = models.DateTimeField(
        verbose_name=_("Measurement beginning time"),
        null=True,
        blank=True,
    )

    time_end = models.DateTimeField(
        verbose_name=_("Measurement beginning time"),
        null=True,
        blank=True,
    )

    time_created = models.DateTimeField(
        verbose_name=_("Time of creation"),
        null=False,
        editable=False,
        auto_now_add=True,
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="measurements"
    )

    name = models.CharField(
        _("measurement name"),
        max_length=150,
    )

    description = MartorField(_("Measurement description"), blank=True)

    public = models.BooleanField(
        verbose_name=_("Will be data publicly available"), default=True
    )

    # Tohle pole by melo obsahovat nasledujici typy:
    MEASUREMENT_TYPES = (
        ("D", "Debug measurement"),
        ("S", "Static measurement"),
        ("M", "Mobile measurement (ground)"),
        ("C", "Civil airborne measurement"),
        ("A", "Special airborne measurement"),
    )

    measurement_type = models.CharField(
        verbose_name=_("Certain measurement type, enum"),
        choices=MEASUREMENT_TYPES,
        default="S",
        help_text=_("Type of measurement"),
    )

    base_location_lat = models.FloatField(null=True, default=None, blank=True)
    base_location_lon = models.FloatField(null=True, default=None, blank=True)
    base_location_alt = models.FloatField(null=True, default=None, blank=True)


    files = models.ManyToManyField(
        File,
        related_name='measurements',
        blank=True,
        help_text=_('Files (logs, trajectories, docs, etc.) associated with this measurement.'),
    )

    def get_absolute_url(self):
        return reverse("measurement-detail", args=[str(self.id)])

    def __str__(self):
        return f"Mereni: {self.name}, Typ: {self.measurement_type}"
    
    def user_directory_path(instance, filename):
        return "data/user_records/{0}/{1}".format(instance.user.id, filename)


    flight = models.ForeignKey(
        Flight,
        on_delete=models.CASCADE,
        related_name="measurement",
        null=True,
        verbose_name=_("Reference na objekt s informacemi o letu"),
        blank=True,
    )

    campaings = models.ManyToManyField(
        MeasurementCampaign, related_name="Campaigns", blank=True
    )


class Trajectory(UUIDMixin):
    name = models.CharField(max_length=80)

    description = models.TextField(null=True, blank=True)

    def __str__(self) -> str:
        return "Trajectory: {}".format(self.name)


class TrajectoryPoint(models.Model):
    datetime = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Point timestamp"),
    )

    location = geomodels.PointField(
        null=True,
        blank=True,
        geography=True,
    )

    trajectory = models.ForeignKey(
        Trajectory, on_delete=models.CASCADE, related_name="points"
    )

    def __str__(self) -> str:
        return "Trajectory point: {}".format(self.trajectory)




class SpectrumData(UUIDMixin):
    """
    Model to store energy spectrum data
    """

    file = models.ForeignKey(
        File,
        on_delete=models.CASCADE,
        related_name="spectrum_data",
        verbose_name=_("File"),
    )

    # spectrum = models.JSONField(
    #     _("Spectrum data"),
    #     help_text=_("Energy spectrum data as an array of integers"),
    #     default=list(),
    # )

    spectrum = ArrayField(models.IntegerField(), blank=True, null=True, size=None)

    integration = models.FloatField(
        _("Integration time"),
        help_text=_("Duration of last exposition"),
        null=True,
        blank=True,
    )

    particles = models.IntegerField(
        _("Particles"),
        help_text=_("Particles detected in the spectrum"),
        null=True,
        blank=True,
    )

    location = models.ForeignKey(
        TrajectoryPoint,
        on_delete=models.CASCADE,
        related_name="spectrum_data",
        null=True,
        blank=True,
    )
    time = models.DurationField(
        verbose_name=_("Time difference"),
        help_text=_("Time difference from the start of the measurement"),
        null=True,
    )

    def __str__(self) -> str:
        return f"Spectrum data {self.file.id}"

    def save(self, *args, **kwargs):
        # self.particles = sum(self.spectrum)

        # self.metadata['particles'] = self.particles

        super(SpectrumData, self).save(*args, **kwargs)
