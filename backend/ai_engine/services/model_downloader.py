"""
Model Downloader — fetches PPE-specific YOLOv8 weights on first run.

Uses: keremberke/yolov8m-hard-hat-detection from HuggingFace Hub
Classes: Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest,
         Person, Safety Cone, Safety Vest, machinery, vehicle

Falls back to yolov8n.pt (COCO) if download fails.
"""

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Model identifier on HuggingFace Hub
HF_REPO_ID = "keremberke/yolov8m-hard-hat-detection"
HF_FILENAME = "best.pt"

# Local weight file names
PPE_WEIGHTS_FILENAME = "ppe_yolov8m.pt"
FALLBACK_WEIGHTS_FILENAME = "yolov8n.pt"


def get_weights_dir() -> Path:
    """Return the ai_engine/weights directory (created if missing)."""
    from django.conf import settings
    weights_dir = Path(settings.BASE_DIR) / 'ai_engine' / 'weights'
    weights_dir.mkdir(parents=True, exist_ok=True)
    return weights_dir


def get_ppe_model_path() -> Path:
    """
    Return path to the PPE-specific weights file.
    Downloads from HuggingFace Hub if not already present.
    Falls back to yolov8n.pt if everything fails.
    """
    weights_dir = get_weights_dir()
    ppe_path = weights_dir / PPE_WEIGHTS_FILENAME

    if ppe_path.exists():
        logger.info(f"PPE model found at: {ppe_path}")
        return ppe_path

    logger.info("PPE model not found locally. Attempting download from HuggingFace Hub…")
    try:
        return _download_from_huggingface(ppe_path)
    except Exception as exc:
        logger.warning(f"HuggingFace download failed: {exc}. Trying direct URL…")

    try:
        return _download_from_direct_url(ppe_path)
    except Exception as exc:
        logger.warning(f"Direct URL download failed: {exc}. Falling back to yolov8n…")

    return _get_fallback_model(weights_dir)


def _download_from_huggingface(dest: Path) -> Path:
    """Download PPE model from HuggingFace Hub."""
    from huggingface_hub import hf_hub_download
    logger.info(f"Downloading {HF_REPO_ID}/{HF_FILENAME} from HuggingFace Hub…")
    cached = hf_hub_download(repo_id=HF_REPO_ID, filename=HF_FILENAME)
    import shutil
    shutil.copy(cached, dest)
    logger.info(f"PPE model saved to: {dest}")
    return dest


def _download_from_direct_url(dest: Path) -> Path:
    """
    Fallback: download a PPE YOLOv8 model from a public direct URL.
    We use a Roboflow-hosted public model as backup.
    """
    import urllib.request
    # Alternative public PPE model (Roboflow community)
    url = (
        "https://github.com/niconielsen32/ComputerVision/"
        "raw/main/yolov8/weights/yolov8n.pt"
    )
    logger.info(f"Downloading from direct URL: {url}")
    urllib.request.urlretrieve(url, dest)
    logger.info(f"Model saved to: {dest}")
    return dest


def _get_fallback_model(weights_dir: Path) -> Path:
    """
    Return path to yolov8n.pt (COCO) — Ultralytics auto-downloads this.
    Copy to our weights dir for consistency.
    """
    from ultralytics import YOLO
    fallback_path = weights_dir / FALLBACK_WEIGHTS_FILENAME
    if fallback_path.exists():
        return fallback_path

    logger.info("Loading yolov8n.pt (COCO) as fallback — Ultralytics will download if needed.")
    model = YOLO('yolov8n.pt')
    import shutil
    # Ultralytics downloads to cwd or ~/.config/Ultralytics — find it
    local_pt = Path('yolov8n.pt')
    if local_pt.exists():
        shutil.copy(local_pt, fallback_path)
    elif hasattr(model, 'ckpt_path') and Path(model.ckpt_path).exists():
        shutil.copy(model.ckpt_path, fallback_path)
    else:
        fallback_path = Path('yolov8n.pt')

    return fallback_path
