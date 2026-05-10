"""
Violation Service — converts raw detection results into SafetyViolation records.
(Refactored for Phase 2)
"""

import logging
from django.utils import timezone
from ..models import DetectionEvent, SafetyViolation, Zone

logger = logging.getLogger(__name__)

def create_violations_from_detection(
    detection_event: DetectionEvent,
    detection_result: dict,
) -> list[SafetyViolation]:
    """
    Parse compliance_results from detection_result and create SafetyViolation records.
    """
    created: list[SafetyViolation] = []
    
    compliance_results = detection_result.get('compliance_results', [])
    zone = detection_event.zone
    
    for res in compliance_results:
        if res['is_compliant']:
            continue
            
        # Create a violation record for each missing PPE item
        missing = res['missing_ppe']
        for ppe_item in missing:
            v_type = 'other'
            if ppe_item == 'helmet': v_type = 'no_helmet'
            elif ppe_item == 'vest': v_type = 'no_vest'
            elif ppe_item == 'mask': v_type = 'no_mask'
            elif ppe_item == 'gloves': v_type = 'no_gloves'
            elif ppe_item == 'shoes': v_type = 'no_shoes'
            elif ppe_item == 'glasses': v_type = 'no_glasses'

            violation = SafetyViolation.objects.create(
                detection_event=detection_event,
                violation_type=v_type,
                confidence_score=round(res['confidence'], 4),
                risk_level=detection_event.risk_score.lower(),
                severity=detection_event.risk_score.lower(),
                bounding_box=res['person_box'],
                required_ppe=detection_result.get('required_ppe', []),
                detected_ppe=res['detected_ppe'],
                ai_summary=f"Worker missing {ppe_item} in monitored zone.",
                zone_risk=zone.risk_category if zone else 'medium',
                zone=zone,
                timestamp=detection_event.created_at or timezone.now(),
            )
            created.append(violation)

    return created

def get_compliance_statistics(days: int = 30) -> dict:
    """
    Compute aggregated compliance statistics over the last N days.
    """
    from django.db.models import Count
    from datetime import timedelta
    from django.utils import timezone as tz

    cutoff = tz.now() - timedelta(days=days)

    total_events = DetectionEvent.objects.filter(
        status='completed', created_at__gte=cutoff
    ).count()

    total_violations = SafetyViolation.objects.filter(
        timestamp__gte=cutoff
    ).count()

    # Aggregate violations by type
    by_type = dict(
        SafetyViolation.objects.filter(timestamp__gte=cutoff)
        .values_list('violation_type')
        .annotate(c=Count('id'))
        .values_list('violation_type', 'c')
    )

    # Aggregate violations by risk level
    by_risk = dict(
        SafetyViolation.objects.filter(timestamp__gte=cutoff)
        .values_list('risk_level')
        .annotate(c=Count('id'))
        .values_list('risk_level', 'c')
    )

    # Violations per day (last N days)
    from django.db.models.functions import TruncDate
    daily = (
        SafetyViolation.objects.filter(timestamp__gte=cutoff)
        .annotate(day=TruncDate('timestamp'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    violations_by_day = [
        {'date': str(row['day']), 'count': row['count']}
        for row in daily
    ]

    # Top zones by violation count
    top_zones = (
        SafetyViolation.objects.filter(timestamp__gte=cutoff, zone__isnull=False)
        .values('zone__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )
    top_zones_list = [
        {'zone': row['zone__name'], 'count': row['count']}
        for row in top_zones
    ]

    # Overall compliance rate
    if total_events > 0:
        clean_events = DetectionEvent.objects.filter(
            status='completed', created_at__gte=cutoff, compliance_status=True
        ).count()
        compliance_rate = round((clean_events / total_events) * 100, 1)
    else:
        compliance_rate = 100.0

    return {
        'total_events': total_events,
        'total_violations': total_violations,
        'compliance_rate': compliance_rate,
        'violations_by_type': by_type,
        'violations_by_risk': by_risk,
        'violations_by_day': violations_by_day,
        'top_zones': top_zones_list,
    }
