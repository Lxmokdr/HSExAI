import os
import django
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Equipement, HardwareIncident, RiskPrediction
from api.services.ml_model import train_risk_model, get_predictor

def run_seed():
    now = timezone.now()
    equipments = list(Equipement.objects.all())

    if len(equipments) < 5:
        print("Not enough equipment to seed risks (min 5).")
        return

    print("Seeding diverse risk data...")

    # 1. Make equipment[0] HIGH RISK (recent incidents > 3)
    eq_high1 = equipments[0]
    incidents1 = list(HardwareIncident.objects.filter(equipement_id=eq_high1.id)[:4])
    while len(incidents1) < 4:
        inc = HardwareIncident.objects.create(
            equipement_id=eq_high1.id,
            date=(now - timedelta(days=5)).date(),
            time=now.time(),
            nom_de_equipement=eq_high1.nom_equipement,
            partition=eq_high1.partition,
            maintenance_type='corrective',
            duree_arret=60
        )
        incidents1.append(inc)
        
    for inc in incidents1:
        inc.date = (now - timedelta(days=5)).date()
        inc.save()
        
    # 2. Make equipment[1] HIGH RISK (avg downtime > 480)
    eq_high2 = equipments[1]
    incidents2 = list(HardwareIncident.objects.filter(equipement_id=eq_high2.id))
    if len(incidents2) == 0:
        HardwareIncident.objects.create(
            equipement_id=eq_high2.id,
            date=(now - timedelta(days=40)).date(),
            time=now.time(),
            nom_de_equipement=eq_high2.nom_equipement,
            partition=eq_high2.partition,
            maintenance_type='corrective',
            duree_arret=600
        )
    else:
        for inc in incidents2:
            inc.duree_arret = 500
            inc.save()

    # 3. Make equipment[2] MEDIUM RISK (2 recent incidents)
    eq_med = equipments[2]
    incidents3 = list(HardwareIncident.objects.filter(equipement_id=eq_med.id)[:2])
    while len(incidents3) < 2:
        inc = HardwareIncident.objects.create(
            equipement_id=eq_med.id,
            date=(now - timedelta(days=15)).date(),
            time=now.time(),
            nom_de_equipement=eq_med.nom_equipement,
            partition=eq_med.partition,
            maintenance_type='corrective',
            duree_arret=30
        )
        incidents3.append(inc)
        
    for inc in incidents3:
        inc.date = (now - timedelta(days=15)).date()
        inc.save()

    # 4. Make the rest low risk (ensure old incidents, small downtime)
    for eq in equipments[3:]:
        for inc in HardwareIncident.objects.filter(equipement_id=eq.id):
            if (now.date() - inc.date).days < 40:
                inc.date = (now - timedelta(days=60)).date()
                if inc.duree_arret and inc.duree_arret > 120:
                    inc.duree_arret = 120
                inc.save()

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
