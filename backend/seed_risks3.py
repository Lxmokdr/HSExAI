import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Equipement, RiskPrediction
from api.services.ml_model import get_predictor, train_risk_model

def run_seed():
    equipments = list(Equipement.objects.all())

    # Ensure model is trained at least once
    train_risk_model()

    print("Forcing EXACTLY 2 High, 5 Medium, rest Low risk data...")
    
    for i, eq in enumerate(equipments):
        if i < 2:
            # 2 High
            RiskPrediction.objects.update_or_create(
                equipement=eq,
                defaults={
                    'risk_score': 0.85 + (i * 0.05),
                    'risk_level': 'HIGH',
                    'confidence': 0.90 + (i * 0.02),
                }
            )
        elif i < 7:
            # 5 Medium
            RiskPrediction.objects.update_or_create(
                equipement=eq,
                defaults={
                    'risk_score': 0.50 + ((i - 2) * 0.03),
                    'risk_level': 'MEDIUM',
                    'confidence': 0.80 + ((i - 2) * 0.02),
                }
            )
        else:
            # Rest Low
            RiskPrediction.objects.update_or_create(
                equipement=eq,
                defaults={
                    'risk_score': 0.10 + ((i % 10) * 0.02),
                    'risk_level': 'LOW',
                    'confidence': 0.95,
                }
            )
            
    print("Done forcing RiskPredictions!")
    print('HIGH:', RiskPrediction.objects.filter(risk_level='HIGH').count())
    print('MEDIUM:', RiskPrediction.objects.filter(risk_level='MEDIUM').count())
    print('LOW:', RiskPrediction.objects.filter(risk_level='LOW').count())

if __name__ == '__main__':
    run_seed()
