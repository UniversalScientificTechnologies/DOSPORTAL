# Authentication views
from .auth import Login, Signup, Logout, Version

# Detector views
from .detectors_qr import DetectorQRCode

# Organization views
from .organizations import (
    UserDetail,
    UserProfile,
    UserOrganizations,
    UserOrganizationsOwned,
)

# Measurement views
from .measurements import (
    MeasurementsGet,
    MeasurementsPost,
    MeasurementDetail,
    MeasurementCreate,
    MeasurementSegmentCreate,
)

# File views
from .files import (
    FileList,
    FileDetail,
    FileUpload,
)

# Spectral views
from .spectrals import (
    SpectralRecordList,
    SpectralRecordCreate,
    SpectralRecordDetail,
    SpectralRecordEvolution,
    SpectralRecordSpectrum,
)

__all__ = [
    # Auth
    "Login",
    "Signup",
    "Logout",
    "Version",
    # Detectors
    "DetectorQRCode",
    # Organizations
    "UserProfile",
    "UserDetail",
    "UserOrganizations",
    "UserOrganizationsOwned",
    # Measurements
    "MeasurementsGet",
    "MeasurementsPost",
    "MeasurementDetail",
    "MeasurementCreate",
    "MeasurementSegmentCreate",
    # Files
    "FileList",
    "FileDetail",
    "FileUpload",
    # Spectrals
    "SpectralRecordList",
    "SpectralRecordCreate",
    "SpectralRecordDetail",
    "SpectralRecordEvolution",
    "SpectralRecordSpectrum",
]
