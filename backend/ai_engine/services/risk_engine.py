"""
Risk Engine — Calculate dynamic risk scores for safety events.
"""

from typing import Any

def calculate_event_risk(compliance_results: list[dict[str, Any]], zone_risk_category: str) -> dict[str, Any]:
    """
    Calculate risk for a detection event.
    
    Risk Level Logic:
    - CRITICAL: Multiple people missing PPE in a high/critical risk zone.
    - HIGH: At least one person missing helmet in a medium/high risk zone.
    - MEDIUM: Missing minor PPE (gloves/mask) or single missing vest.
    - LOW: All compliant or single minor violation in low risk zone.
    """
    total_persons = len(compliance_results)
    violators = [r for r in compliance_results if not r['is_compliant']]
    num_violations = len(violators)
    
    if num_violations == 0:
        return {'score': 'LOW', 'compliance_status': True, 'summary': "All personnel are PPE-compliant."}
    
    # Check for critical missing PPE
    missing_helmets = any('helmet' in r['missing_ppe'] for r in violators)
    missing_vests = any('vest' in r['missing_ppe'] for r in violators)
    
    risk_level = 'MEDIUM'
    
    if zone_risk_category == 'critical' or (num_violations > 2 and missing_helmets):
        risk_level = 'CRITICAL'
    elif missing_helmets or (zone_risk_category == 'high' and missing_vests):
        risk_level = 'HIGH'
    elif zone_risk_category == 'low' and not missing_helmets:
        risk_level = 'LOW'
        
    summary = f"Detected {num_violations} violations across {total_persons} personnel. "
    if missing_helmets:
        summary += "Critical: Personnel detected without helmets."
    elif missing_vests:
        summary += "Warning: Personnel detected without safety vests."
    
    return {
        'score': risk_level,
        'compliance_status': False,
        'summary': summary
    }
