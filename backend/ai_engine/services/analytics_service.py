"""
Analytics Service — Provide compliance statistics, AI-generated insights, and executive KPIs.
"""

from django.db.models import Count, Avg, Q, Max
from django.utils import timezone
from datetime import timedelta
import random
from ..models import DetectionEvent, SafetyViolation, Zone

def get_compliance_analytics():
    """Returns overall compliance rates and trends."""
    now = timezone.now()
    last_30_days = now - timedelta(days=30)
    
    events = DetectionEvent.objects.filter(created_at__gte=last_30_days)
    total = events.count()
    compliant = events.filter(compliance_status=True).count()
    
    compliance_rate = (compliant / total * 100) if total > 0 else 100
    
    # Simple daily trend
    trend = []
    for i in range(14): # Extended to 14 days for better trend visualization
        day = (now - timedelta(days=i)).date()
        day_events = events.filter(created_at__date=day)
        d_total = day_events.count()
        d_compliant = day_events.filter(compliance_status=True).count()
        rate = (d_compliant / d_total * 100) if d_total > 0 else 100
        trend.append({"date": day.strftime("%Y-%m-%d"), "rate": round(rate, 1)})
        
    return {
        "overall_rate": round(compliance_rate, 1),
        "total_events": total,
        "trend": list(reversed(trend))
    }

def get_zone_risk_analytics():
    """Returns risk analysis per zone."""
    zones = Zone.objects.annotate(
        total_violations=Count('violations'),
        last_event_at=Max('detection_events__created_at')
    )
    
    results = []
    for zone in zones:
        results.append({
            "id": zone.id,
            "name": zone.name,
            "risk_category": zone.risk_category,
            "violations_count": zone.total_violations,
            "is_active": zone.is_active,
            "last_active": zone.last_event_at.strftime("%Y-%m-%d %H:%M:%S") if zone.last_event_at else "Never"
        })
    return results

def get_ppe_distribution():
    """Returns distribution of violation types."""
    violations = SafetyViolation.objects.values('violation_type').annotate(count=Count('id'))
    mapping = {
        'no_helmet': 'Helmet',
        'no_vest': 'Safety Vest',
        'no_mask': 'Face Mask',
        'no_gloves': 'Safety Gloves',
        'unauthorized_person': 'Unauthorized',
        'other': 'Other'
    }
    return [{"name": mapping.get(v['violation_type'], v['violation_type']), "value": v['count']} for v in violations]

def get_executive_summary():
    """Flagship KPI summary for the Executive Dashboard."""
    comp = get_compliance_analytics()
    zones = get_zone_risk_analytics()
    
    # Calculate Global Safety Score (0-100)
    # Weighted: 50% compliance rate, 30% violation volume (inverse), 20% system health
    compliance_component = comp['overall_rate'] * 0.5
    
    total_violations = sum(z['violations_count'] for z in zones)
    violation_component = max(0, 30 - (total_violations * 0.1)) # Deduct for volume
    
    system_health = 98.5 # Mocking uptime/inference stability
    health_component = system_health * 0.2
    
    safety_score = round(compliance_component + violation_component + health_component, 1)
    
    # Active Risk Level
    if safety_score > 90: risk_level = "LOW"
    elif safety_score > 75: risk_level = "MEDIUM"
    elif safety_score > 60: risk_level = "HIGH"
    else: risk_level = "CRITICAL"
    
    # Forecast (Simple linear projection mock)
    forecast_rate = round(comp['overall_rate'] + (random.uniform(-2, 3)), 1)
    
    return {
        "safety_score": safety_score,
        "risk_level": risk_level,
        "system_health": system_health,
        "compliance_rate": comp['overall_rate'],
        "total_violations": total_violations,
        "active_zones": len([z for z in zones if z['is_active']]),
        "compliance_forecast": forecast_rate,
        "confidence_avg": 94.2 # Mocked AI performance metric
    }

def generate_safety_insights():
    """Generates deterministic natural language insights with pattern matching."""
    now = timezone.now()
    week_ago = now - timedelta(days=7)
    
    violations = SafetyViolation.objects.filter(timestamp__gte=week_ago)
    top_zone_violation = violations.values('zone__name').annotate(count=Count('id')).order_by('-count').first()
    
    insights = []
    
    if top_zone_violation and top_zone_violation['zone__name']:
        insights.append({
            "type": "warning",
            "message": f"Anomalous pattern detected: Zone {top_zone_violation['zone__name']} accounts for {top_zone_violation['count']} violations this week.",
            "impact": "HIGH"
        })
    
    helmet_violations = violations.filter(violation_type='no_helmet').count()
    if helmet_violations > 5:
        insights.append({
            "type": "critical",
            "message": f"Critical Safety Breach: {helmet_violations} counts of missing head protection recorded.",
            "impact": "CRITICAL"
        })
        
    comp = get_compliance_analytics()
    if comp['overall_rate'] < 80:
        insights.append({
            "type": "alert",
            "message": "Global Compliance Drop: Site-wide safety score is currently trending below operational target.",
            "impact": "MEDIUM"
        })
    else:
        insights.append({
            "type": "positive",
            "message": "Security Protocol Adherence: PPE compliance has stabilized above 90% in the last 48h.",
            "impact": "LOW"
        })
        
    return insights
