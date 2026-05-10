"""
Detection Service — Core YOLOv8 PPE inference pipeline (Refactored for Phase 2).
"""

import time
import logging
import uuid
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image
from django.conf import settings

from .image_processor import load_and_validate, resize_for_inference, pil_to_numpy
from .model_downloader import get_ppe_model_path
from .compliance_service import evaluate_compliance
from .risk_engine import calculate_event_risk
from .image_annotation import draw_enhanced_annotations
from ..models import Zone

logger = logging.getLogger(__name__)

# Model singleton
_model = None

def _get_model():
    """Lazy-load YOLOv8 model."""
    global _model
    if _model is None:
        from ultralytics import YOLO
        weights_path = get_ppe_model_path()
        _model = YOLO(str(weights_path))
    return _model

def run_detection(
    image_file,
    confidence_threshold: float = 0.35,
    zone_id: int | None = None,
) -> dict[str, Any]:
    """
    Phase 2 Detection Pipeline:
    1. Inference
    2. Compliance Check (Per-Person)
    3. Risk Scoring (Event-Level)
    4. Enhanced Annotation
    """
    t_start = time.perf_counter()

    # 1. Load Image
    try:
        pil_img = load_and_validate(image_file)
        pil_img = resize_for_inference(pil_img)
        img_np = pil_to_numpy(pil_img)
    except ValueError as exc:
        return {'success': False, 'error': str(exc)}

    # 2. YOLOv8 Inference
    try:
        model = _get_model()
        results = model.predict(source=img_np, conf=confidence_threshold, verbose=False)
    except Exception as exc:
        logger.exception("YOLOv8 inference failed")
        return {'success': False, 'error': f"Inference error: {exc}"}

    # 3. Parse Detections
    detected_objects = []
    if results and len(results) > 0:
        res = results[0]
        for box in res.boxes:
            cls_id = int(box.cls[0].item())
            cls_name = model.names.get(cls_id, f'class_{cls_id}')
            conf = float(box.conf[0].item())
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
            detected_objects.append({
                'class_name': cls_name,
                'confidence': round(conf, 4),
                'bounding_box': {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}
            })

    # 4. Compliance & Risk
    zone = Zone.objects.filter(id=zone_id).first() if zone_id else None
    req_ppe = zone.required_ppe_rules if zone else ['helmet', 'vest']
    
    compliance_results = evaluate_compliance(detected_objects, req_ppe, image_np=img_np)
    risk_info = calculate_event_risk(compliance_results, zone.risk_category if zone else 'medium')

    # 5. Enhanced Annotation
    annotated_np = draw_enhanced_annotations(img_np.copy(), compliance_results, detected_objects)
    annotated_rel_path = _save_annotated(annotated_np)

    processing_ms = round((time.perf_counter() - t_start) * 1000, 1)

    return {
        'success': True,
        'processing_time_ms': processing_ms,
        'detected_objects': detected_objects,
        'compliance_results': compliance_results,
        'risk_score': risk_info['score'],
        'compliance_status': risk_info['compliance_status'],
        'ai_summary': risk_info['summary'],
        'annotated_image_path': annotated_rel_path,
        'image_size': [img_np.shape[1], img_np.shape[0]],
    }

def _save_annotated(img_rgb: np.ndarray) -> str:
    media_root = Path(settings.MEDIA_ROOT)
    rel_dir = Path('detections') / 'annotated'
    abs_dir = media_root / rel_dir
    abs_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    abs_path = abs_dir / filename
    Image.fromarray(img_rgb.astype(np.uint8)).save(str(abs_path), format='JPEG', quality=90)
    return str(rel_dir / filename)
