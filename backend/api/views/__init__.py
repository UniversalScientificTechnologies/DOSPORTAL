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
# File views
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
    # Files
    # Spectrals
    "SpectralRecordList",
    "SpectralRecordCreate",
    "SpectralRecordDetail",
    "SpectralRecordEvolution",
    "SpectralRecordSpectrum",
]
