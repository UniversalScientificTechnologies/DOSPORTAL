from django.db import models
from .utils import UUIDMixin
from django.conf import settings
from django.utils.translation import gettext as _
from django.urls import reverse
from markdownx.models import MarkdownxField
from markdownx.utils import markdownify
from .organizations import Organization

class DetectorManufacturer(UUIDMixin):
    name = models.CharField(max_length=80)
    url = models.URLField(max_length=200)
    
    def __str__(self) -> str:
        return f"Detector manufacturer: <a href='{self.url}'>{self.name}</a>"


class DetectorType(UUIDMixin):

    name = models.CharField(
        max_length=80,
    )

    manufacturer = models.ForeignKey(DetectorManufacturer, on_delete=models.CASCADE)

    image = models.ImageField(
        verbose_name=_("Detector image"),
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
    description = models.TextField(_("Description of calibration status"))

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        related_name="calibrations",
        null=True,
        default=None,
    )

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