# Authentication views
from .auth import Login, Signup, Logout, Version

# Detector views
from .detectors import (
    detector_manufacturer_list,
    detector_manufacturer_detail,
    DetectorTypeList,
    DetectorTypeDetail,
    DetectorGet,
    DetectorLogbookGet,
    DetectorLogbookPost,
    DetectorLogbookPut,
    DetectorQRCode,
)

# Organization views
from .organizations import (
    Organizations,
    OrganizationDetail,
    OrganizationMember,
    UserDetail,
    UserProfile,
    UserOrganizations,
    UserOrganizationsOwned,
    CreateOrganizationInvite,
    AcceptOrganizationInvite,
    GetOrganizationInviteDetails,
)

# Measurement views
from .measurements import (
    MeasurementsGet,
    MeasurementsPost,
    MeasurementDetail,
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
    "detector_manufacturer_list",
    "detector_manufacturer_detail",
    "DetectorTypeList",
    "DetectorTypeDetail",
    "DetectorGet",
    "DetectorLogbookGet",
    "DetectorLogbookPost",
    "DetectorLogbookPut",
    "DetectorQRCode",
    # Organizations
    "Organizations",
    "OrganizationDetail",
    "OrganizationMember",
    "UserProfile",
    "UserDetail",
    "UserOrganizations",
    "UserOrganizationsOwned",
    "CreateOrganizationInvite",
    "AcceptOrganizationInvite",
    "GetOrganizationInviteDetails",
    # Measurements
    "MeasurementsGet",
    "MeasurementsPost",
    "MeasurementDetail",
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
