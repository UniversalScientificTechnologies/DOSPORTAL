"""
QR Code generation utilities for detector logbook entries
"""

import qrcode
from qrcode.image.svg import SvgPathImage
from io import BytesIO
from PIL import Image, ImageDraw


def generate_qr_code(url: str, format: str = "png") -> BytesIO:
    """
    Generate QR code for a given URL

    Args:
        url: The URL to encode in the QR code
        format: 'png' or 'svg'

    Returns:
        BytesIO object containing the QR code image
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )

    qr.add_data(url)
    qr.make(fit=True)

    buffer = BytesIO()

    if format == "svg":
        img = qr.make_image(image_factory=SvgPathImage)
        img.save(buffer)
    else:  # PNG
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(buffer, format="PNG")

    buffer.seek(0)
    return buffer


def generate_qr_detector_with_label(
    url: str, detector_name: str, serial_number: str
) -> BytesIO:
    """
    Generate QR code with detector information labels

    Args:
        url: The URL to encode
        detector_name: Name of the detector
        serial_number: Serial number of the detector

    Returns:
        BytesIO object containing the labeled QR code image
    """
    # Generate base QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )

    qr.add_data(url)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color="black", back_color="white")

    # Convert QR image to RGB mode for compatibility
    qr_img = qr_img.convert("RGB")

    # Create a new image with space for labels
    qr_width, qr_height = qr_img.size
    label_height = 80
    total_height = qr_height + label_height

    final_img = Image.new("RGB", (qr_width, total_height), "white")
    final_img.paste(qr_img, (0, 0))

    # Add labels
    draw = ImageDraw.Draw(final_img)
    text_y = qr_height + 10
    text_x = 10
    draw.text(
        (text_x, text_y),
        f"NAME: {detector_name}",
        fill="black",
        anchor="lt",
        font_size=24,
    )
    text_y += 35
    draw.text(
        (text_x, text_y),
        f"SN: {serial_number}",
        fill="black",
        anchor="lt",
        font_size=24,
    )

    buffer = BytesIO()
    final_img.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer
