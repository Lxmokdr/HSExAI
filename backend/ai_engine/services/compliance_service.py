import cv2
import numpy as np
from typing import Any

def evaluate_compliance(
    detected_objects: list[dict[str, Any]], 
    required_ppe: list[str],
    image_np: np.ndarray | None = None
) -> list[dict[str, Any]]:
    """
    Evaluate compliance for each person detected.
    
    DEMO ENHANCEMENT:
    If 'vest' is required but the model doesn't support it, we use a color-based 
    heuristic (Orange/Yellow detection) on the person's torso.
    """
    # 1. Identify "Personnel"
    persons = [obj for obj in detected_objects if obj['class_name'].lower() == 'person']
    
    if not persons:
        hardhat_objs = [
            obj for obj in detected_objects 
            if 'hardhat' in obj['class_name'].lower() or 'helmet' in obj['class_name'].lower()
        ]
        for hh in hardhat_objs:
            bb = hh['bounding_box']
            persons.append({
                'class_name': 'person',
                'confidence': hh['confidence'],
                'bounding_box': {
                    'x1': bb['x1'] - 60, 'y1': bb['y1'], 
                    'x2': bb['x2'] + 60, 'y2': bb['y2'] + 500
                },
                'is_proxy': True
            })

    ppe_items = [obj for obj in detected_objects if obj['class_name'].lower() != 'person']
    compliance_results = []
    
    for person in persons:
        pb = person['bounding_box']
        detected_for_person = []
        
        # 2. Map existing detections
        for ppe in ppe_items:
            ppeb = ppe['bounding_box']
            center_x = (ppeb['x1'] + ppeb['x2']) / 2
            center_y = (ppeb['y1'] + ppeb['y2']) / 2
            
            if (pb['x1'] <= center_x <= pb['x2']) and (pb['y1'] <= center_y <= pb['y2']):
                cls_name = ppe['class_name'].lower()
                
                # STRICT MATCHING: Ensure we don't match 'NO-Hardhat' as a helmet
                if 'no-' in cls_name or 'no_' in cls_name:
                    continue

                if 'helmet' in cls_name or 'hardhat' in cls_name:
                    detected_for_person.append('helmet')
                elif 'vest' in cls_name:
                    detected_for_person.append('vest')
                elif 'mask' in cls_name:
                    detected_for_person.append('mask')
                elif 'gloves' in cls_name:
                    detected_for_person.append('gloves')
                elif 'shoe' in cls_name or 'boot' in cls_name:
                    detected_for_person.append('shoes')
                elif 'glass' in cls_name or 'goggle' in cls_name:
                    detected_for_person.append('glasses')

        # 3. HEURISTIC: Color-based Vest Detection (if model failed)
        if 'vest' in required_ppe and 'vest' not in detected_for_person and image_np is not None:
            h, w = image_np.shape[:2]
            vy1 = max(0, pb['y1'] + int((pb['y2'] - pb['y1']) * 0.2))
            vy2 = min(h, pb['y1'] + int((pb['y2'] - pb['y1']) * 0.6))
            vx1 = max(0, pb['x1'] + int((pb['x2'] - pb['x1']) * 0.1))
            vx2 = min(w, pb['x1'] + int((pb['x2'] - pb['x1']) * 0.9))
            
            if vx2 > vx1 and vy2 > vy1:
                torso_roi = image_np[vy1:vy2, vx1:vx2]
                hsv = cv2.cvtColor(torso_roi, cv2.COLOR_RGB2HSV)
                mask_hi_vis = cv2.bitwise_or(
                    cv2.inRange(hsv, np.array([0, 100, 100]), np.array([25, 255, 255])),
                    cv2.inRange(hsv, np.array([25, 100, 100]), np.array([50, 255, 255]))
                )
                if np.sum(mask_hi_vis) > (torso_roi.size * 0.04):
                    detected_for_person.append('vest')
                    detected_objects.append({
                        'class_name': 'Safety Vest (Heuristic)',
                        'confidence': 0.85,
                        'bounding_box': {'x1': vx1, 'y1': vy1, 'x2': vx2, 'y2': vy2}
                    })

        # 4. HEURISTIC: Color-based Glove Detection (if model failed)
        if 'gloves' in required_ppe and 'gloves' not in detected_for_person and image_np is not None:
            h, w = image_np.shape[:2]
            gy1 = max(0, pb['y1'] + int((pb['y2'] - pb['y1']) * 0.4))
            gy2 = min(h, pb['y1'] + int((pb['y2'] - pb['y1']) * 0.8))
            
            lx1, lx2 = max(0, pb['x1'] - 40), min(w, pb['x1'] + 60)
            rx1, rx2 = max(0, pb['x2'] - 60), min(w, pb['x2'] + 40)
            
            for hx1, hx2 in [(lx1, lx2), (rx1, rx2)]:
                if hx2 > hx1 and gy2 > gy1:
                    hand_roi = image_np[gy1:gy2, hx1:hx2]
                    hsv = cv2.cvtColor(hand_roi, cv2.COLOR_RGB2HSV)
                    mask_white = cv2.inRange(hsv, np.array([0, 0, 180]), np.array([180, 50, 255]))
                    mask_hi_vis = cv2.bitwise_or(
                        cv2.inRange(hsv, np.array([0, 100, 100]), np.array([25, 255, 255])),
                        cv2.inRange(hsv, np.array([25, 100, 100]), np.array([50, 255, 255]))
                    )
                    
                    if np.sum(mask_white) > (hand_roi.size * 0.1) or np.sum(mask_hi_vis) > (hand_roi.size * 0.1):
                        detected_for_person.append('gloves')
                        detected_objects.append({
                            'class_name': 'Safety Gloves (Heuristic)',
                            'confidence': 0.82,
                            'bounding_box': {'x1': hx1, 'y1': gy1, 'x2': hx2, 'y2': gy2}
                        })
                        break

        # 5. Final check
        missing_ppe = [item for item in required_ppe if item not in detected_for_person]
        is_compliant = len(missing_ppe) == 0
        
        compliance_results.append({
            'person_box': pb,
            'is_compliant': is_compliant,
            'detected_ppe': list(set(detected_for_person)),
            'missing_ppe': missing_ppe,
            'confidence': person['confidence'],
            'is_proxy': person.get('is_proxy', False)
        })
        
    return compliance_results
