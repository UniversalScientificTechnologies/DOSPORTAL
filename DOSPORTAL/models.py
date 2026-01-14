import datetime
from typing import Iterable
from django.db import models
import uuid
from django.utils.translation import gettext as _
from django.conf import settings
from django.urls import reverse
from matplotlib.colors import LightSource
from martor.models import MartorField
from django_q.tasks import async_task
from django.utils.text import slugify
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.contrib.gis.db import models as geomodels
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import Distance
from django import forms

from DOSPORTAL.services.file_validation import validate_uploaded_file

from markdownx.models import MarkdownxField
import json
from markdownx.utils import markdownify

# from .tasks import process_flight_entry, process_record_entry


def get_enum_dsc(enum, t):
    for r in enum:
        if r[0] == t:
            return r[1]
    return t


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


class UUIDMixin(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, unique=True
    )

    def get_admin_url(self):
        return reverse(
            "admin:%s_%s_change" % (self._meta.app_label, self._meta.model_name),
            args=(self.id,),
        )

    class Meta:
        abstract = True


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    image = models.ImageField(
        default="default_user_profileimage.jpg", upload_to="profile_pics"
    )
    web = models.URLField(max_length=200, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"  # show how we want it to be displayed


class Organization(UUIDMixin):
    DATA_POLICY_CHOICES = [
        ("PR", "Private"),
        ("PU", "Public"),
        ("NV", "Non-public"),
    ]

    name = models.CharField(max_length=200)
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="organizations",
        through="OrganizationUser",
    )
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    data_policy = models.CharField(
        max_length=2, choices=DATA_POLICY_CHOICES, default="PU"
    )
    can_users_change_policy = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    website = models.URLField(max_length=200, null=True, blank=True)
    contact_email = models.EmailField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Aktualizace slug pole na základě názvu, pokud není zadáno
        if not self.slug:
            self.slug = slugify(self.name)
        super(Organization, self).save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_members(self):
        return ", ".join([str(user) for user in self.users.all()])

    def get_admin_url(self):
        return reverse(
            "admin:%s_%s_change" % (self._meta.app_label, self._meta.model_name),
            args=(self.id,),
        )

    def get_absolute_url(self):
        return reverse("organization-detail", args=[str(self.id)])


class OrganizationUser(models.Model):

    USER_TYPE_CHOICES = [
        ("ME", "Member"),
        ("AD", "Admin"),
        ("OW", "Owner"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_users",
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="user_organizations"
    )
    user_type = models.CharField(max_length=2, choices=USER_TYPE_CHOICES, default="ME")

    class Meta:
        unique_together = ("user", "organization")

    def __str__(self):
        return f"{self.user.username}: {self.get_user_type_display()} of {self.organization.name}"


class CARImodel(UUIDMixin):
    data = models.JSONField()


class Airports(UUIDMixin):
    name = models.CharField()
    code_iata = models.CharField(null=True, unique=True)
    code_icao = models.CharField(null=True, unique=True)

    lat = models.FloatField(null=True)
    lon = models.FloatField(null=True)
    alt = models.FloatField(null=True)

    municipality = models.CharField(null=True)
    web = models.CharField(null=True)

    def __str__(self) -> str:
        return "Airport {} ({})".format(self.code_iata, self.name)


class Flight(UUIDMixin):

    flight_number = models.CharField()

    takeoff = models.ForeignKey(
        Airports, on_delete=models.CASCADE, related_name="takeoff"
    )

    departure_time = models.DateTimeField(
        verbose_name=_("Scheduled departure time"),
        null=True,
    )

    land = models.ForeignKey(Airports, on_delete=models.CASCADE, related_name="landing")

    def user_directory_path(instance, filename):
        return "data/flights/{0}/{1}/path.txt".format(
            instance.flight_number.rstrip(),
            instance.departure_time.strftime("%Y-%m-%d %H:%M"),
        )

    trajectory_file = models.FileField(
        verbose_name=_("Trajectory log"),
        upload_to=user_directory_path,
    )

    cari = models.ForeignKey(CARImodel, on_delete=models.CASCADE, null=True, blank=True)

    def get_absolute_url(self):
        return reverse("flight-detail", args=[str(self.id)])

    def __str__(self) -> str:
        return "Flight {} ({}->{}) @ {}".format(
            self.flight_number,
            self.takeoff.code_iata,
            self.land.code_iata,
            self.departure_time.strftime("%Y-%m-%d %H:%M"),
        )

    def save(self, *args, **kwargs):
        print("ASYNYC..", self)
        # async_task(process_flight_entry, self)
        super(Flight, self).save(*args, **kwargs)

    class Meta:
        unique_together = ("flight_number", "departure_time")


class MeasurementDataFlight(UUIDMixin):
    flight = models.ForeignKey(
        Flight, on_delete=models.CASCADE, related_name="measurements"
    )


class DetectorManufacturer(UUIDMixin):

    name = models.CharField(
        max_length=80,
    )

    url = models.URLField(max_length=200)

    def __str__(self) -> str:
        return "Detector manufacturer: <a href='{}'>{}</a>".format(self.url, self.name)


class DetectorType(UUIDMixin):

    name = models.CharField(
        max_length=80,
    )

    manufacturer = models.ForeignKey(DetectorManufacturer, on_delete=models.CASCADE)

    image = models.ImageField(
        name=_("Detector image"),
        help_text=_("Detector image"),
        upload_to="detector_images",
        null=True,
        blank=True,
    )

    url = models.URLField(max_length=200, null=True, blank=True)

    description = MarkdownxField(
        verbose_name=_("Detector description"),
        help_text=_("Detector description"),
        blank=True,
    )

    def get_absolute_url(self):
        return reverse("detector-type-view", args=[str(self.id)])

    def get_admin_url(self):
        return reverse(
            "admin:%s_%s_change" % (self._meta.app_label, self._meta.model_name),
            args=(self.id,),
        )

    def __str__(self) -> str:
        return "Detector type {} ({})".format(self.name, self.manufacturer.name)

    @property
    def description_formatted(self):
        return markdownify(self.description)

    @property
    def formatted_label(self):
        return f"""<a class='btn btn-sm btn-info' href='{self.get_absolute_url()}'> <i class='bi bi-cpu-fill'></i> {self.name}</a>"""


class DetectorCalib(UUIDMixin):

    name = models.CharField(_("Calibration name"))

    created = models.DateTimeField(auto_now_add=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        related_name="calibrations",
        null=True,
        default=None,
    )

    description = models.TextField(_("Description of calibration status"))

    created = models.DateTimeField(auto_now_add=True)

    coef0 = models.FloatField(_("Coefficient 0 (offset)"), default=0.0)

    coef1 = models.FloatField(_("Coefficient 1, (linear)"), default=1)

    coef2 = models.FloatField(_("Coefficient 2, (quadratic)"), default=0.0)

    # author = models.ForeignKey(
    #     settings.AUTH_USER_MODEL,
    #     on_delete=models.CASCADE,
    # )

    def __str__(self) -> str:
        return f"Calibration '{self.name}' ({self.coef0/1000:.2f}+x*{self.coef1/1000:.2f} KeV), {self.created}, {self.description}"


class Detector(UUIDMixin):

    sn = models.CharField(
        max_length=80,
    )

    name = models.CharField(
        _("Detector name"),
        max_length=150,
    )

    type = models.ForeignKey(DetectorType, on_delete=models.CASCADE)

    calib = models.ManyToManyField(
        DetectorCalib,
        blank=True,
        # name=_("Detector calibration"),
        related_name="detectors",
        help_text=_("Detector calibration"),
        # limit_choices_to=,
    )

    manufactured_date = models.DateField(
        _("Manufactured date"),
        help_text=_("Date when detector was manufactured"),
        null=True,
        blank=True,
    )

    data = models.JSONField(
        _("Detector metadata"),
        help_text="Detector metadata, used for advanced data processing and maintaining",
        default=dict,
        blank=True,
    )

    owner = models.ForeignKey(
        Organization,
        on_delete=models.DO_NOTHING,
        related_name="detectors",
        blank=True,
        null=True,
    )

    access = models.ManyToManyField(
        Organization, related_name="detector_access", blank=True
    )

    def get_absolute_url(self):
        return reverse("detector-view", args=[str(self.id)])

    def __str__(self) -> str:
        return "Detector {} ({}), SN:{}".format(
            self.name, self.type.manufacturer.name, self.sn
        )

    @property
    def formatted_label(self):
        return f"""<a class='btn btn-sm btn-info' title='{self.type}' href='{self.type.get_absolute_url()}'> <i class='bi bi-cpu-fill'></i> {self.type.name}</a>
                <a class='btn btn-sm btn-info' title='{self}' href='{self.get_absolute_url()}'>{self.name} <span class='text-small text-muted'>({self.sn})</span></a>"""


class DetectorLogbook(UUIDMixin):

    detector = models.ForeignKey(
        Detector, on_delete=models.CASCADE, related_name="logbook"
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )

    created = models.DateTimeField(auto_now_add=True)

    modified = models.DateTimeField(
        auto_now=True,
        null=True,
        blank=True,
    )

    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="modified_logbook_entries",
        null=True,
        blank=True,
    )

    text = models.TextField(
        _("Logbook text"),
        help_text="Detailed description of activity made on the detector.",
    )

    public = models.BooleanField(
        _("Wish to be visible to everyone?"),
        help_text=_(
            "Private logbook will be visible for maintainers of detector and for dosportal admins."
        ),
        default=True,
    )

    ENTRY_TYPE_CHOICES = [
        ("reset", "Reset"),
        ("sync", "Sync"),
        ("maintenance", "Maintenance"),
        ("note", "Note"),
        ("location_update", "Location update"),
        ("calibration", "Calibration"),
        ("other", "Other"),
    ]

    SOURCE_CHOICES = [
        ("web", "Web"),
        ("api", "API"),
        ("qr", "QR"),
        ("auto", "Automatic"),
        ("other", "Other"),
    ]

    entry_type = models.CharField(
        max_length=30,
        choices=ENTRY_TYPE_CHOICES,
        default="note",
        help_text=_("Category of the logbook entry."),
    )

    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="web",
        help_text=_("Origin of the logbook entry."),
    )

    latitude = models.FloatField(
        verbose_name=_("Latitude"),
        help_text=_("GPS latitude of the location"),
        null=True,
        blank=True,
    )

    longitude = models.FloatField(
        verbose_name=_("Longitude"),
        help_text=_("GPS longitude of the location"),
        null=True,
        blank=True,
    )

    altitude = models.FloatField(
        verbose_name=_("Altitude"),
        help_text=_("Altitude of the location in meters"),
        null=True,
        blank=True,
    )

    location_text = models.CharField(
        verbose_name=_("Location (text)"),
        max_length=255,
        null=True,
        blank=True,
        help_text=_("Location description in text format (e.g., address)"),
    )

    class Meta:
        ordering = ["-created"]


class measurement_campaign(UUIDMixin):

    name = models.CharField(
        _("measurement name"), max_length=150, null=True, blank=True
    )

    def __str__(self) -> str:
        return "Campaign: {}".format(self.name)


class measurement(UUIDMixin):
    """
    Měřením se rozumí sada měření, které analyzují jednu a tu samou věc a jsou změřeny jedním detektorem.
    Pokud jsou v latedle dva detektory, tak to jsou dvě měření. Pokud je ale měření z jednoho detektoru
    přerušeno a navázáno novým záznamem, tak to je celé jedno měření.

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

    def user_directory_path(instance, filename):
        return "data/user_records/{0}/{1}".format(instance.user.id, filename)

    location_file = models.FileField(
        verbose_name=_("File log"), upload_to=user_directory_path, blank=True
    )

    def get_absolute_url(self):
        return reverse("measurement-detail", args=[str(self.id)])

    def __str__(self):
        return f"Mereni: {self.name}, Typ: {self.measurement_type}"

    flight = models.ForeignKey(
        Flight,
        on_delete=models.CASCADE,
        related_name="measurement",
        null=True,
        verbose_name=_("Reference na objekt s informacemi o letu"),
        blank=True,
    )

    campaings = models.ManyToManyField(
        measurement_campaign, related_name="Campaigns", blank=True
    )


class Record(UUIDMixin):

    name = models.CharField(
        max_length=80,
        verbose_name=_("Record name"),
        help_text=_("Name of this record. Short and simple description of record."),
        null=True,
        blank=False,
        default="Record",
    )

    detector = models.ForeignKey(
        Detector,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="records",
    )

    def user_directory_path(instance, filename):
        print("USER FILENAME", filename)
        return "user_records/record_{0}".format(instance.pk)

    def user_directory_path_data(instance, extension="pk"):
        print("USER FILENAME", extension)
        return "user_records/record_{0}.{1}".format(instance.pk, extension)

    log_file = models.FileField(
        verbose_name=_("File log"),
        help_text=_("Upload recorded data file form your detector"),
        upload_to=user_directory_path,
        blank=True,
        validators=[_validate_log_file],
    )

    description = MarkdownxField(
        verbose_name=_("Description"),
        help_text=_("Description of the record"),
        blank=True,
    )

    log_original_filename = models.CharField(
        verbose_name=_("Original filename of log file"),
        null=True,
        blank=True,
        max_length=150,
    )

    data_file = models.FileField(
        verbose_name=_("Log file"),
        help_text=_("Processed spectral file"),
        upload_to=user_directory_path_data,
        null=True,
        blank=True,
        validators=[_validate_data_file],
    )

    metadata_file = models.FileField(
        verbose_name=_("Metadata file"),
        help_text=_("Processed metadata file"),
        upload_to=user_directory_path_data,
        null=True,
        blank=True,
        validators=[_validate_metadata_file],
    )

    time_tracked = models.BooleanField(
        verbose_name=_("Is time tracked?"),
        default=False,
        help_text=_(
            "Tick this box if the record is dependent on absolute time. When you need align record to real time."
        ),
    )

    time_internal_start = models.FloatField(
        verbose_name=_("Internal time start"),
        help_text=_("System time of record start"),
        null=True,
        blank=True,
        default=0,
    )

    time_start = models.DateTimeField(
        verbose_name=_("Measurement beginning time"),
        help_text=(
            "When 'time is tracked', you can set start time of the record beginning. "
        ),
        null=True,
        blank=True,
        default=datetime.datetime(2000, 1, 1, 0, 0, 0),
    )

    time_of_interest_start = models.FloatField(
        verbose_name=_("Time of interest start"), null=True, blank=True, default=None
    )

    time_of_interest_end = models.FloatField(
        verbose_name=_("Time of interest end"), null=True, blank=True, default=None
    )

    created = models.DateTimeField(
        verbose_name=_("Time of creation"),
        null=False,
        editable=False,
        auto_now_add=True,
    )

    record_duration = models.DurationField(
        verbose_name=_("Record duration"), help_text=_("Duration of record"), null=True
    )

    # Tohle pole by melo obsahovat nasledujici typy:
    RECORD_TYPES = (
        ("U", "Unknown"),
        ("S", "Spectral measurements"),
        ("E", "Event measurements"),
        ("L", "Location"),
    )

    record_type = models.CharField(
        verbose_name=_("Certain record type, enum"),
        choices=RECORD_TYPES,
        default="U",
        help_text=_("Type of log file"),
    )

    metadata = models.JSONField(
        _("record_metadata"),
        help_text=_(
            "record metadata, used for advanced data processing and maintaining"
        ),
        default=dict,
        blank=True,
    )

    calib = models.ForeignKey(
        DetectorCalib,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="records",
    )

    belongs = models.ForeignKey(
        Organization,
        on_delete=models.DO_NOTHING,
        null=True,
        related_name="records_owning",
        max_length=2,
        choices=Organization.DATA_POLICY_CHOICES,
        default="PU",
        help_text=_(
            "Data policy of this record. Field can be overridden depending by setting of the organisation, that owns this record."
        ),
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    def save(self, *args, **kwargs):
        super(Record, self).save(*args, **kwargs)

    def __str__(self) -> str:
        return "record ({}, {}, start {}, {})".format(
            self.belongs, self.log_original_filename, self.time_start, 0
        )

    # def description(self) -> str:
    #     return "Record ({}, {})".format(get_enum_dsc(self.RECORD_TYPES, self.record_type), self.time_start.strftime("%Y-%m-%d_%H:%M"))

    def calibration_select_form(self):
        class selectCalibForm(forms.ModelForm):
            class Meta:
                model = Record
                # fields = ['calib']
                exclude = []

            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                detector = self.instance.detector
                if detector:
                    self.fields["calib"].queryset = detector.calib.all()
                else:
                    self.fields["calib"].queryset = DetectorCalib.objects.none()

        return selectCalibForm

    @property
    def formatted_markdown(self):
        return markdownify(self.description)


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


from django.contrib.postgres.fields import ArrayField, HStoreField


class SpectrumData(UUIDMixin):
    """
    Model to store energy spectrum data
    """

    record = models.ForeignKey(
        "record",
        on_delete=models.CASCADE,
        related_name="spectrum_data",
        verbose_name=_("Record"),
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
        return f"Spectrum data {self.record.id}"

    def save(self, *args, **kwargs):
        # self.particles = sum(self.spectrum)

        # self.metadata['particles'] = self.particles

        super(SpectrumData, self).save(*args, **kwargs)
