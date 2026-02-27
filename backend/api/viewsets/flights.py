"""ViewSets for Flight and Airports."""
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from DOSPORTAL.models.flights import Airports, Flight
from ..serializers.measurements import AirportSerializer, FlightSerializer


@extend_schema_view(
    list=extend_schema(description="List airports.", tags=["Flights"]),
    retrieve=extend_schema(description="Get airport detail.", tags=["Flights"]),
)
class AirportsViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AirportSerializer
    queryset = Airports.objects.all().order_by("name")


@extend_schema_view(
    list=extend_schema(description="List flights.", tags=["Flights"]),
    retrieve=extend_schema(description="Get flight detail.", tags=["Flights"]),
)
class FlightViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FlightSerializer
    queryset = Flight.objects.select_related("takeoff", "land").all().order_by("departure_time")
