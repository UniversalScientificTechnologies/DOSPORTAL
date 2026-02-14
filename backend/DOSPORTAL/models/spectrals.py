from .utils import UUIDMixin
from django.db import models
from ..models.organizations import Organization
from django.conf import settings
from ..models.detectors import Detector, DetectorCalib
from markdownx.models import MarkdownxField
from django.utils.translation import gettext as _
from DOSPORTAL.services.file_validation import validate_uploaded_file
import datetime


def _validate_log_file(uploaded_file):
    return validate_uploaded_file(
        uploaded_file,
        allowed_extensions=[
            ".log",
            ".txt",
            ".csv",
            ".json",
        ],
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
            ".pkl",
        ],
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
        ],
        max_size_mb=20,
    )


def user_directory_path(instance, filename):
    """Generate upload path for user files."""
    return f"user_records/record_{instance.pk}/{filename}"


def user_directory_path_data(instance, extension="pk"):
    """Generate data file path."""
    return f"user_records/record_{instance.pk}/data.{extension}"

class SpectralRecord(UUIDMixin):

    name = models.CharField(
        max_length=80,
        verbose_name="Record name",
        help_text="Name of this record. Short and simple description of record.",
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

    raw_file = models.ForeignKey(
        'File',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="spectral_records_raw",
        help_text="Uploaded sourcec File",
    )

    description = MarkdownxField(
        verbose_name=_("Description"),
        help_text=_("Description of the record"),
        blank=True,
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

    owner = models.ForeignKey(
        Organization,
        on_delete=models.DO_NOTHING,
        null=True,
        related_name="records_owning",
        max_length=2,
        choices=Organization.DATA_POLICY_CHOICES,
        default="PU",
        help_text=_(
            "Data policy of this record. Field can be overridden depending on the settings of the owning organization."
        ),
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    # Processing status for async tasks
    PROCESSING_PENDING = "pending"          # uploaded to, waiting for being processed into artifacts
    PROCESSING_IN_PROGRESS = "processing"   # post processing in async task started
    PROCESSING_COMPLETED = "completed"      # post processing finished: artifacts created
    PROCESSING_FAILED = "failed"            # post processing finished: artifacts NOT created
    
    PROCESSING_STATUS_CHOICES = (
        (PROCESSING_PENDING, "Pending processing"),
        (PROCESSING_IN_PROGRESS, "Processing in progress"),
        (PROCESSING_COMPLETED, "Processing completed"),
        (PROCESSING_FAILED, "Processing failed"),
    )
    
    processing_status = models.CharField(
        max_length=16,
        choices=PROCESSING_STATUS_CHOICES,
        default=PROCESSING_PENDING,
        help_text="Status of async background processing"
    )


class SpectralRecordArtifact(UUIDMixin):
    SPECTRAL_FILE = "spectral"


    ARTIFACT_TYPES = (
        (SPECTRAL_FILE, "Processed log file into spectral file (Parquet)"),
    )

    artifact_type = models.CharField(
        max_length=16,
        choices=ARTIFACT_TYPES,
        help_text="Type of artifact (e.g. histogram, processed spectral logs, ...)",
    )

    artifact = models.ForeignKey(
        'File',
        on_delete=models.CASCADE,
        related_name="spectral_artifacts",
        help_text="Processed file (artifact) referencing File",
    )

    spectral_record = models.ForeignKey(
        SpectralRecord,
        on_delete=models.CASCADE,
        related_name="artifacts",
        help_text="Reference to SpectralRecord to which this artifact belongs",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Time when the artifact was created",
    )
    
    