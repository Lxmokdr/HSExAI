"""
Image Annotation Service — Draw boxes, labels, and compliance status.
"""

import cv2
import numpy as np

# Colors (BGR)
COLOR_COMPLIANT = (0, 200, 0)   # Green
COLOR_VIOLATION = (0, 0, 220)   # Red
COLOR_INFO = (200, 140, 0)      # Orange
COLOR_WHITE = (255, 255, 255)

def draw_enhanced_annotations(img_rgb: np.ndarray, compliance_results: list[dict], detected_objects: list[dict]) -> np.ndarray:
    """
    Draw advanced annotations on the image.
    1. Draw PPE items with orange thin boxes.
    2. Draw Persons with thick green/red boxes based on compliance.
    3. Add labels with missing PPE info.
    """
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    h, w = img_bgr.shape[:2]
    font_scale = max(0.45, min(0.8, w / 1000))
    thickness_person = max(3, int(w / 300))
    thickness_ppe = max(1, int(w / 600))

    # 1. Draw PPE items first (lower layer)
    ppe_items = [obj for obj in detected_objects if obj['class_name'].lower() != 'person']
    for ppe in ppe_items:
        bb = ppe['bounding_box']
        cv2.rectangle(img_bgr, (bb['x1'], bb['y1']), (bb['x2'], bb['y2']), COLOR_INFO, thickness_ppe, cv2.LINE_AA)

    # 2. Draw Persons and Compliance Status
    for res in compliance_results:
        pb = res['person_box']
        is_compliant = res['is_compliant']
        color = COLOR_COMPLIANT if is_compliant else COLOR_VIOLATION
        
        # Draw thick box for person
        cv2.rectangle(img_bgr, (pb['x1'], pb['y1']), (pb['x2'], pb['y2']), color, thickness_person, cv2.LINE_AA)
        
        # Label text
        status_text = "COMPLIANT" if is_compliant else f"VIOLATION: Missing {', '.join(res['missing_ppe'])}"
        label = f"PERSON {res['confidence']:.0%} - {status_text}"
        
        (lw, lh), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 1)
        
        # Label background
        label_y = max(pb['y1'] - 10, lh + 10)
        cv2.rectangle(img_bgr, (pb['x1'], label_y - lh - 10), (pb['x1'] + lw + 10, label_y + 5), color, -1)
        
        # Label text
        cv2.putText(img_bgr, label, (pb['x1'] + 5, label_y - 2), cv2.FONT_HERSHEY_SIMPLEX, font_scale, COLOR_WHITE, 1, cv2.LINE_AA)

    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
