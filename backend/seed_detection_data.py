"""
Seed script: populate initial Zones + sample DetectionEvents + SafetyViolations
for demo/development purposes.

Run with:
    python seed_detection_data.py
from the backend/ directory with venv activated.
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
import random

from ai_engine.models import Zone, DetectionEvent, SafetyViolation
from api.models import User

print("🌱 Seeding AI Safety data...")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Zones
# ─────────────────────────────────────────────────────────────────────────────
ZONES = [
    {"name": "Assembly Line A",    "description": "Main vehicle assembly line",         "risk_category": "high",     "location": "Building 1, Floor 1"},
    {"name": "Warehouse B",        "description": "Raw materials storage warehouse",     "risk_category": "medium",   "location": "Building 2"},
    {"name": "Loading Dock C",     "description": "Truck loading and unloading area",   "risk_category": "high",     "location": "Building 3, East Gate"},
    {"name": "Control Room",       "description": "Operations control and monitoring",  "risk_category": "low",      "location": "Building 1, Floor 2"},
    {"name": "Maintenance Bay",    "description": "Heavy equipment maintenance area",   "risk_category": "critical", "location": "Building 4"},
]

created_zones = []
for z_data in ZONES:
    zone, created = Zone.objects.get_or_create(name=z_data["name"], defaults=z_data)
    created_zones.append(zone)
    status = "✅ Created" if created else "⚠️  Already exists"
    print(f"  {status}: Zone '{zone.name}'")

# ─────────────────────────────────────────────────────────────────────────────
# 2. Get a user for created_by (first superadmin, or any)
# ─────────────────────────────────────────────────────────────────────────────
try:
    seed_user = User.objects.filter(role='superadmin').first() or User.objects.first()
except Exception:
    seed_user = None

# ─────────────────────────────────────────────────────────────────────────────
# 3. Sample DetectionEvents + SafetyViolations
# ─────────────────────────────────────────────────────────────────────────────
VIOLATION_CONFIGS = [
    {"violation_type": "no_helmet", "risk_level": "high",   "conf_range": (0.72, 0.96)},
    {"violation_type": "no_vest",   "risk_level": "medium", "conf_range": (0.60, 0.89)},
    {"violation_type": "no_mask",   "risk_level": "medium", "conf_range": (0.55, 0.85)},
]

SAMPLE_DETECTIONS = [
    {"objects": ["Person", "NO-Hardhat"],               "n_violations": 1},
    {"objects": ["Person", "NO-Safety Vest"],            "n_violations": 1},
    {"objects": ["Person", "Hardhat", "Safety Vest"],   "n_violations": 0},
    {"objects": ["Person", "NO-Hardhat", "NO-Safety Vest"], "n_violations": 2},
    {"objects": ["Person", "Hardhat"],                  "n_violations": 0},
    {"objects": ["Person", "NO-Hardhat"],               "n_violations": 1},
    {"objects": ["Person", "Safety Vest"],              "n_violations": 0},
    {"objects": ["Person", "NO-Safety Vest"],           "n_violations": 1},
    {"objects": ["Person", "Hardhat", "Safety Vest"],   "n_violations": 0},
    {"objects": ["Person", "NO-Hardhat"],               "n_violations": 1},
]

# Create 30 events over the last 30 days
print("\n📸 Creating DetectionEvents and SafetyViolations...")
events_created = 0
violations_created = 0

for i in range(30):
    sample = SAMPLE_DETECTIONS[i % len(SAMPLE_DETECTIONS)]
    zone = random.choice(created_zones)
    days_ago = random.randint(0, 30)
    event_time = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))

    detected_objects = [
        {
            "class_name": cls,
            "confidence": round(random.uniform(0.60, 0.95), 4),
            "bounding_box": {
                "x1": random.randint(50, 200),
                "y1": random.randint(50, 150),
                "x2": random.randint(300, 500),
                "y2": random.randint(300, 450),
            },
        }
        for cls in sample["objects"]
    ]

    event = DetectionEvent.objects.create(
        original_image='detections/original/sample.jpg',
        annotated_image='detections/annotated/sample_annotated.jpg',
        detection_results={
            "detected_objects": detected_objects,
            "violation_classes": [o for o in sample["objects"] if o.startswith("NO-")],
            "compliant_classes": [o for o in sample["objects"] if o in ("Hardhat", "Safety Vest", "Mask")],
            "image_size": [640, 480],
        },
        processing_time_ms=round(random.uniform(120, 850), 1),
        zone=zone,
        status='completed',
        created_by=seed_user,
        created_at=event_time,
    )
    events_created += 1

    # Create violations for this event
    for obj in detected_objects:
        cls_name = obj["class_name"]
        violation_map = {
            "NO-Hardhat":      ("no_helmet", "high"),
            "NO-Safety Vest":  ("no_vest",   "medium"),
            "NO-Mask":         ("no_mask",   "medium"),
        }
        if cls_name in violation_map:
            v_type, v_risk = violation_map[cls_name]
            SafetyViolation.objects.create(
                detection_event=event,
                violation_type=v_type,
                confidence_score=obj["confidence"],
                risk_level=v_risk,
                bounding_box=obj["bounding_box"],
                zone=zone,
                timestamp=event_time,
            )
            violations_created += 1

print(f"  ✅ Created {events_created} DetectionEvents")
print(f"  ✅ Created {violations_created} SafetyViolations")
print("\n🎉 Seed complete!")
