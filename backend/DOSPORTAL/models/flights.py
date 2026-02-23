from django.db import models
from django.urls import reverse
from django.utils.translation import gettext as _
from ..models.utils import UUIDMixin


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


class CARImodel(UUIDMixin):
    data = models.JSONField()


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

    cari = models.ForeignKey('CARImodel', on_delete=models.CASCADE, null=True, blank=True)

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