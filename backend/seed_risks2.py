import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Equipement, HardwareIncident, RiskPrediction
from api.services.ml_model import train_risk_model, get_predictor

def run_seed():
    now = timezone.now()
    equipments = list(Equipement.objects.all())

    print("Seeding very strong diverse risk data...")
    
    # Clean up all existing hardware incidents to start fresh
    HardwareIncident.objects.all().delete()

    # 1. 5 Equipments -> HIGH RISK (10 recent incidents, 1000 min downtime each)
    for eq in equipments[:5]:
        for i in range(10):
            HardwareIncident.objects.create(
                equipement_id=eq.id,
                date=(now - timedelta(days=i)).date(),
                time=now.time(),
                nom_de_equipement=eq.nom_equipement,
                partition=eq.partition,
                maintenance_type='corrective',
                duree_arret=1000
            )

    # 2. 5 Equipments -> MEDIUM RISK (3 recent incidents, 300 min downtime each)
    for eq in equipments[5:10]:
        for i in range(3):
            HardwareIncident.objects.create(
                equipement_id=eq.id,
                date=(now - timedelta(days=i*5)).date(),
                time=now.time(),
                nom_de_equipement=eq.nom_equipement,
                partition=eq.partition,
                maintenance_type='corrective',
                duree_arret=300
            )

    # 3. 10 Equipments -> LOW RISK (1 old incident, 10 min downtime)
    for eq in equipments[10:20]:
        HardwareIncident.objects.create(
            equipement_id=eq.id,
            date=(now - timedelta(days=100)).date(),
            time=now.time(),
            nom_de_equipement=eq.nom_equipement,
            partition=eq.partition,
            maintenance_type='corrective',
            duree_arret=10
        )
        
    # The rest have 0 incidents

    print("Data seeded. Training model...")
    res = train_risk_model()
    print("Training Results:", res)
    
    print("Updating RiskPrediction for all equipment...")
    predictor = get_predictor()
    for eq in equipments:
        pred = predictor.predict(eq.id)
        if 'error' not in pred:
            RiskPrediction.objects.update_or_create(
                equipement=eq,
                defaults={
                    'risk_score': pred['risk_score'],
                    'risk_level': pred['risk_level'],
                    'confidence': pred['confidence'],
                }
            )
            print(f"Equipment {eq.nom_equipement}: {pred['risk_level']} (Score: {pred['risk_score']:.2f})")

if __name__ == '__main__':
    run_seed()
