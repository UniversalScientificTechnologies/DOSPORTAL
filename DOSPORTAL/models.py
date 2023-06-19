from django.db import models
import uuid
from django.utils.translation import gettext as _
from django.conf import settings
from django.urls import reverse
from matplotlib.colors import LightSource

class UUIDMixin(models.Model):

    id = models.UUIDField(
        primary_key = True,
        default = uuid.uuid4,
        editable = False,
        unique = True
    )

    class Meta:
    	abstract = True



class Airports(UUIDMixin):
    name = models.CharField()
    code_iata = models.CharField(null=True, unique=True)
    code_icao = models.CharField(null=True, unique=True)

    lat = models.FloatField(null=True)
    lon = models.FloatField(null=True)
    alt = models.FloatField(null=True)

    def __str__(self) -> str:
        return "Airport {} ({})".format(self.code_iata, self.name)

class Flight(UUIDMixin):

    callsign = models.CharField()

    takeoff = models.ForeignKey(
        Airports,
        on_delete=models.CASCADE,
        related_name="takeoff")
    
    land = models.ForeignKey(
        Airports,
        on_delete=models.CASCADE,
        related_name="landing")


    def user_directory_path(instance, filename):
        return "data/flights/{0}/{1}".format(instance.callsign, instance.pk)

    trajectory_file = models.FileField(
        verbose_name=_("Trajectory log"),
        upload_to=user_directory_path,
    )


    def __str__(self) -> str:
        return "Flight {} ({}->{})".format(self.callsign, self.takeoff.code_iata, self.land.code_iata)



class MeasurementDataFlight(UUIDMixin):
    flight = models.ForeignKey(
        Flight,
        on_delete=models.CASCADE,
        related_name="measurements")


class DetectorManufacturer(UUIDMixin):
    
    name = models.CharField(
        max_length = 80,
    )
    
    url = models.URLField(max_length=200)

    def __str__(self) -> str:
        return "Detector manufacturer: {}".format(self.name)

class DetectorType(UUIDMixin):

    name = models.CharField(
        max_length = 80,
    )

    manufacturer = models.ForeignKey(
        DetectorManufacturer,
        on_delete=models.CASCADE
    )


    def __str__(self) -> str:
        return "Detector type {} ({}))".format(self.name, self.manufacturer.name)

class Detector(UUIDMixin):

    sn = models.CharField(
        max_length = 80,
    )

    name = models.CharField(
        _("Detector name"),
        max_length=150,
    )

    type = models.ForeignKey(
        DetectorType,
        on_delete=models.CASCADE
    )



class measurement(UUIDMixin):
    """
    Měřením se rozumí sada měření, které analyzují jednu a tu samou věc a jsou změřeny jedním detektorem.
    Pokud jsou v latedle dva detektory, tak to jsou dvě měření. Pokud je ale měření z jednoho detektoru
    přerušeno a navázáno novým záznamem, tak to je celé jedno měření. 
    
    """
    
    time_start = models.DateTimeField(
        verbose_name = _("Measurement beginning time"),
        null=True,
    )

    time_end = models.DateTimeField(
        verbose_name = _("Measurement beginning time"),
        null=True,
    )

    time_created = models.DateTimeField(
        verbose_name = _("Time of creation"),
        null=False,
        editable=False,
        auto_now_add=True
    )
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )

    name = models.CharField(
        _("measurement name"),
        max_length=150,
    )

    description = models.CharField(
        _("Measurement description"),
        max_length=500,
    )

    # Tohle pole by melo obsahovat nasledujici typy:
    MEASUREMENT_TYPES = (
        ('D', 'Debug measurement'),
        ('S', 'Static measurement'),
        ('M', 'Mobile measurement (ground)'),
        ('C', 'Civil airborne measurement'),
        ('A', 'Special airborne measurement')
    )

    public = models.BooleanField(
        verbose_name=_("Will be data publicly available"),
        default = True
    )

    measurement_type = models.CharField(
        verbose_name=_("Certain measurement type, enum"),
        choices=MEASUREMENT_TYPES,
        blank=True,
        default="S",
        help_text=_("Type of measurement")
    )

    base_location_lat = models.FloatField(null=True, default=None)
    base_location_lon = models.FloatField(null=True, default=None)
    base_location_alt = models.FloatField(null=True, default=None)


    def user_directory_path(instance, filename):
        return "data/user_records/{0}/{1}".format(instance.user.id, filename)

    location_file = models.FileField(
        verbose_name=_("File log"),
        upload_to=user_directory_path,
    )

    def get_absolute_url(self):
        return reverse('measurement-detail', args=[str(self.id)])

    def __str__(self):
        return f'Mereni: {self.name}'

class record(UUIDMixin):

    measurement = models.ForeignKey(
        measurement,
        on_delete=models.CASCADE,
        related_name='records'
    )
    
    detector = models.ForeignKey(
        Detector,
        on_delete=models.CASCADE,
        null=True
    )

    def user_directory_path(instance, filename):
        # return "data/user_records/{0}/{1}".format(instance.user.id, filename)
        print(".....")
        print(instance.measurement.author.pk)
        return "data/user_records/log_{1}".format(instance.measurement.author.pk, instance.pk)

    log_file = models.FileField(
        verbose_name=_("File log"),
        upload_to=user_directory_path,
    )

    log_filename = models.CharField(

    )

    time_start = models.DateTimeField(
        verbose_name = _("Measurement beginning time"),
        null=True,
    )

    time_end = models.DateTimeField(
        verbose_name = _("Measurement beginning time"),
        null=True,
    )

    def __str__(self) -> str:
        return "record ({})".format(self.log_file)
    
    flight = models.ForeignKey(
        Flight,
        on_delete=models.CASCADE,
        related_name = "record",
        null = True,
        verbose_name=_("Reference na objekt s informacemi o letu")
    )


