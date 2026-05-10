"""
Image Processor — preprocessing utilities for YOLOv8 inference.
Handles validation, resizing, format normalization.
"""

import io
import logging
from pathlib import Path
from PIL import Image, ExifTags
import numpy as np

logger = logging.getLogger(__name__)

# Maximum input dimension to avoid OOM
MAX_IMAGE_DIM = 1280
SUPPORTED_FORMATS = {'JPEG', 'JPG', 'PNG', 'BMP', 'WEBP', 'TIFF'}


def load_and_validate(image_file) -> Image.Image:
    """
    Load an image from a Django InMemoryUploadedFile or file path.
    Returns a PIL Image in RGB mode.
    Raises ValueError for unsupported formats or corrupt files.
    """
    try:
        img = Image.open(image_file)
        img.verify()                      # Detect corrupt files
        image_file.seek(0)               # Rewind after verify
        img = Image.open(image_file)
    except Exception as exc:
        raise ValueError(f"Cannot open image: {exc}") from exc

    fmt = (img.format or '').upper()
    if fmt not in SUPPORTED_FORMATS and fmt != '':
        raise ValueError(f"Unsupported image format: {fmt}. Use JPEG, PNG, or WEBP.")

    # Fix EXIF orientation before converting
    img = _fix_exif_orientation(img)

    # Normalise to RGB (drop alpha, convert palettes, etc.)
    if img.mode != 'RGB':
        img = img.convert('RGB')

    return img


def resize_for_inference(img: Image.Image, max_dim: int = MAX_IMAGE_DIM) -> Image.Image:
    """
    Resize image so neither width nor height exceeds max_dim.
    Preserves aspect ratio. Skips resize if already within limits.
    """
    w, h = img.size
    if max(w, h) <= max_dim:
        return img
    scale = max_dim / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    return img.resize((new_w, new_h), Image.LANCZOS)


def pil_to_numpy(img: Image.Image) -> np.ndarray:
    """Convert PIL Image → numpy array (H, W, C) uint8 RGB."""
    return np.array(img)


def numpy_to_pil(arr: np.ndarray) -> Image.Image:
    """Convert numpy array (H, W, C) uint8 → PIL Image RGB."""
    return Image.fromarray(arr.astype(np.uint8))


def save_image(img: Image.Image, save_path: Path, quality: int = 90) -> None:
    """Save PIL image to disk, creating parent dirs as needed."""
    save_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(save_path), format='JPEG', quality=quality, optimize=True)


def _fix_exif_orientation(img: Image.Image) -> Image.Image:
    """Rotate image to match EXIF orientation tag if present."""
    try:
        exif = img._getexif()  # type: ignore[attr-defined]
        if exif is None:
            return img
        orientation_key = next(
            (k for k, v in ExifTags.TAGS.items() if v == 'Orientation'), None
        )
        if orientation_key is None:
            return img
        orientation = exif.get(orientation_key)
        rotations = {3: 180, 6: 270, 8: 90}
        degrees = rotations.get(orientation)
        if degrees:
            img = img.rotate(degrees, expand=True)
    except Exception:
        pass  # Non-critical — just return as-is
    return img
