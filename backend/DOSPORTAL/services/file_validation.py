import os
from django.core.exceptions import ValidationError

"""
This file will (TODO) contain specific hook implementations for file data validation and parsing logic
"""


def validate_uploaded_file(uploaded_file, allowed_extensions=None, max_size_mb=None):
    """guard: extension and size"""
    ext = os.path.splitext(uploaded_file.name)[1].lower()
    if allowed_extensions:
        if ext not in allowed_extensions:
            allowed = ", ".join(allowed_extensions)
            raise ValidationError(
                f"Unsupported file extension '{ext}'. Allowed: {allowed}"
            )

    if max_size_mb is not None:
        limit_bytes = max_size_mb * 1024 * 1024
        if uploaded_file.size and uploaded_file.size > limit_bytes:
            raise ValidationError(
                f"File too large. Max size of filetype {ext} is {max_size_mb} MB."
            )

