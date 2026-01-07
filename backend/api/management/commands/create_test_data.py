from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date, time
from api.models import Equipement, HardwareIncident, SoftwareIncident, Report
import random


class Command(BaseCommand):
    help = 'Create test data for equipment, hardware incidents, and software incidents'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test data before creating new data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing test data...')
            HardwareIncident.objects.all().delete()
            SoftwareIncident.objects.all().delete()
            Report.objects.all().delete()
            Equipement.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✅ Cleared existing data'))

        self.stdout.write('Creating test data...')

        # Create equipment - using real equipment names from the application
        equipment_data = [
            # Servers
            {'num_serie': 'SN-RTP1A-001', 'nom_equipement': 'ALER Serveur traitement radar (RTP1A)', 'partition': 'ALER'},
            {'num_serie': 'SN-RTP1B-002', 'nom_equipement': 'ALER Serveur traitement radar (RTP1B)', 'partition': 'ALER'},
            {'num_serie': 'SN-FDP1A-003', 'nom_equipement': 'ALER Serveur traitement données de vol (FDP1A)', 'partition': 'ALER'},
            {'num_serie': 'SN-FDP1B-004', 'nom_equipement': 'ALER Serveur traitement données de vol (FDP1B)', 'partition': 'ALER'},
            {'num_serie': 'SN-AGP1A-005', 'nom_equipement': 'ALER Serveur traitement données AIR SOL (AGP1A)', 'partition': 'ALER'},
            {'num_serie': 'SN-AGP1B-006', 'nom_equipement': 'ALER Serveur traitement données AIR SOL (AGP1B)', 'partition': 'ALER'},
            {'num_serie': 'SN-DRA01-007', 'nom_equipement': 'ALER Serveur DRA01', 'partition': 'ALER'},
            {'num_serie': 'SN-MTP1A-008', 'nom_equipement': 'ALER Serveur multi traking radar (MTP1A)', 'partition': 'ALER'},
            {'num_serie': 'SN-MTP1B-009', 'nom_equipement': 'ALER Serveur multi traking radar (MTP1B)', 'partition': 'ALER'},
            {'num_serie': 'SN-CDP1A-010', 'nom_equipement': 'ALER Serveur Communication inter partition CDP1A', 'partition': 'ALER'},
            {'num_serie': 'SN-CDP1B-011', 'nom_equipement': 'ALER Serveur Communication inter partition CDP1B', 'partition': 'ALER'},
            {'num_serie': 'SN-REC1A-012', 'nom_equipement': 'ALER Serveur d\'enregistrement REC1A', 'partition': 'ALER'},
            {'num_serie': 'SN-REC1B-013', 'nom_equipement': 'ALER Serveur d\'enregistrement REC1B', 'partition': 'ALER'},
            {'num_serie': 'SN-REP1A-014', 'nom_equipement': 'ALER Serveur de rejeu REP1A', 'partition': 'ALER'},
            {'num_serie': 'SN-DBM-015', 'nom_equipement': 'ALER Serveur base de données DBM', 'partition': 'ALER'},
            # Routers
            {'num_serie': 'SN-ROUT01-016', 'nom_equipement': 'ALER ROUTEUR 01 CISCO 2600', 'partition': 'ALER'},
            {'num_serie': 'SN-ROUT02-017', 'nom_equipement': 'ALER ROUTEUR 02 CISCO 2600', 'partition': 'ALER'},
            {'num_serie': 'SN-ROUT03-018', 'nom_equipement': 'ALER ROUTEUR 03 CISCO 2600', 'partition': 'ALER'},
            # Switches
            {'num_serie': 'SN-SW01-019', 'nom_equipement': 'ALER SWITCH Cisco 2950 ops 1A 48 P', 'partition': 'ALER'},
            {'num_serie': 'SN-SW02-020', 'nom_equipement': 'ALER SWITCH Cisco 2950 ops 2A 48 P', 'partition': 'ALER'},
            {'num_serie': 'SN-SW03-021', 'nom_equipement': 'ALER SWITCH Cisco 2950 ops 1B 48 P', 'partition': 'ALER'},
            {'num_serie': 'SN-SW04-022', 'nom_equipement': 'ALER SWITCH Cisco 2950 ops 2B 48 P', 'partition': 'ALER'},
            # Additional equipment
            {'num_serie': 'SN-EXC01-023', 'nom_equipement': 'ALEREXC01', 'partition': 'ALER'},
            {'num_serie': 'SN-EXC03-024', 'nom_equipement': 'ALEREXC03', 'partition': 'ALER'},
            {'num_serie': 'SN-PLC01-025', 'nom_equipement': 'ALERPLC01', 'partition': 'ALER'},
            {'num_serie': 'SN-PLC03-026', 'nom_equipement': 'ALERPLC03', 'partition': 'ALER'},
            {'num_serie': 'SN-MIL01-027', 'nom_equipement': 'ALERMIL01', 'partition': 'ALER'},
            {'num_serie': 'SN-OPS-028', 'nom_equipement': 'ALEROPS', 'partition': 'ALER'},
        ]

        equipment_objects = []
        for eq_data in equipment_data:
            equip, created = Equipement.objects.get_or_create(
                num_serie=eq_data['num_serie'],
                defaults={
                    'nom_equipement': eq_data['nom_equipement'],
                    'partition': eq_data['partition'],
                    'etat': 'actuel'
                }
            )
            equipment_objects.append(equip)
            if created:
                self.stdout.write(f'  ✅ Created equipment: {eq_data["num_serie"]}')

        # Create hardware incidents
        hardware_descriptions = [
            'Panne du système de refroidissement',
            'Défaillance du module de transmission',
            'Problème de connectivité réseau',
            'Dégradation du signal radar',
            'Erreur de calibration du système',
            'Surveillance du système de sécurité',
            'Maintenance préventive effectuée',
            'Remplacement de composant défectueux',
        ]

        hardware_anomalies = [
            'Surchauffe du processeur',
            'Perte de signal intermittente',
            'Erreur de communication',
            'Signal faible détecté',
            'Dérive de calibration',
            'Alerte système',
            'Vérification de routine',
            'Composant usé',
        ]

        hardware_actions = [
            'Nettoyage et remplacement du ventilateur',
            'Remplacement du module de transmission',
            'Reconfiguration du réseau',
            'Ajustement de l\'antenne',
            'Recalibration complète',
            'Vérification des systèmes',
            'Inspection et maintenance',
            'Remplacement du composant',
        ]

        maintenance_types = ['preventive', 'corrective', None]
        
        # Generate incidents for multiple years
        current_year = date.today().year
        years_to_generate = [current_year, current_year - 1, current_year - 2]  # Current year and 2 previous years
        
        total_hardware_incidents = 0
        for year in years_to_generate:
            # Determine number of incidents per year (more for current year)
            if year == current_year:
                incidents_count = 30
            elif year == current_year - 1:
                incidents_count = 25
            else:
                incidents_count = 20
            
            # Determine date range for the year
            year_start = date(year, 1, 1)
            if year == current_year:
                year_end = date.today()
            else:
                year_end = date(year, 12, 31)
            
            days_in_year = (year_end - year_start).days
            
            for i in range(incidents_count):
                days_ago = random.randint(0, days_in_year)
                incident_date = year_end - timedelta(days=days_ago)
                incident_time = time(random.randint(0, 23), random.randint(0, 59))
                
                equip = random.choice(equipment_objects)
                desc = random.choice(hardware_descriptions)
                anomalie = random.choice(hardware_anomalies)
                action = random.choice(hardware_actions)
                
                # For previous years, ensure we have both preventive and corrective
                # (dashboard will filter to show only corrective for previous years)
                if year < current_year:
                    # Previous years: mix of corrective and preventive (but dashboard shows only corrective)
                    maintenance_type = random.choice(['preventive', 'corrective'])
                else:
                    # Current year: all types including None
                    maintenance_type = random.choice(maintenance_types)
                
                incident = HardwareIncident.objects.create(
                    date=incident_date,
                    time=incident_time,
                    nom_de_equipement=equip.nom_equipement,
                    partition=equip.partition,
                    numero_de_serie=equip.num_serie,
                    equipement_id=equip.id,
                    description=desc,
                    anomalie_observee=anomalie,
                    action_realisee=action,
                    piece_de_rechange_utilisee=f'Pièce {random.randint(100, 999)}' if random.random() > 0.3 else '',
                    etat_de_equipement_apres_intervention='Fonctionnel' if random.random() > 0.2 else 'En observation',
                    recommendation='Surveillance continue recommandée' if random.random() > 0.5 else '',
                    duree_arret=random.randint(30, 480) if random.random() > 0.4 else None,
                    maintenance_type=maintenance_type,
                )
                total_hardware_incidents += 1
                if i == 0 or i == incidents_count - 1:
                    self.stdout.write(f'  ✅ Created hardware incident #{incident.id} for year {year}')
        
        self.stdout.write(f'  ✅ Created {total_hardware_incidents} hardware incidents total')

        # Create software incidents
        software_descriptions = [
            'Erreur de traitement des données radar',
            'Problème de synchronisation entre systèmes',
            'Défaillance du logiciel de contrôle',
            'Erreur dans le calcul de trajectoire',
            'Problème d\'affichage sur l\'interface',
            'Perte de connexion avec le serveur',
            'Erreur de validation des données',
            'Problème de performance du système',
        ]

        software_sujets = [
            'Erreur système',
            'Problème de synchronisation',
            'Défaillance logicielle',
            'Erreur de calcul',
            'Problème d\'interface',
            'Connexion perdue',
            'Validation échouée',
            'Performance dégradée',
        ]

        servers = ['radar', 'FDP', 'AGP', 'SNMAP']
        nom_radar_options = ['OS', 'MG', 'SD', 'LO', 'BY']
        
        # Generate software incidents for multiple years
        current_year = date.today().year
        years_to_generate = [current_year, current_year - 1, current_year - 2]  # Current year and 2 previous years
        
        total_software_incidents = 0
        for year in years_to_generate:
            # Determine number of incidents per year (more for current year)
            if year == current_year:
                incidents_count = 20
            elif year == current_year - 1:
                incidents_count = 18
            else:
                incidents_count = 15
            
            # Determine date range for the year
            year_start = date(year, 1, 1)
            if year == current_year:
                year_end = date.today()
            else:
                year_end = date(year, 12, 31)
            
            days_in_year = (year_end - year_start).days
            
            for i in range(incidents_count):
                days_ago = random.randint(0, days_in_year)
                incident_date = year_end - timedelta(days=days_ago)
                incident_time = time(random.randint(0, 23), random.randint(0, 59))
                
                incident = SoftwareIncident.objects.create(
                    date=incident_date,
                    time=incident_time,
                    server=random.choice(servers) if random.random() > 0.2 else '',
                    partition=random.choice(['CCR', 'ALAP', '']) if random.random() > 0.3 else '',
                    position=f'STA-{random.randint(1, 10)}' if random.random() > 0.4 else '',
                    type_d_anomalie=random.choice(['Systeme', 'aleatoire', '']),
                    call_sign=f'IND-{random.randint(100, 999)}' if random.random() > 0.5 else '',
                    nom_radar=random.choice(nom_radar_options) if random.random() > 0.4 else '',
                    FL=f'FL{random.randint(100, 400)}' if random.random() > 0.5 else '',
                    longitude=f'{random.uniform(-180, 180):.6f}' if random.random() > 0.6 else '',
                    latitude=f'{random.uniform(-90, 90):.6f}' if random.random() > 0.6 else '',
                    code_SSR=f'SSR-{random.randint(100, 999)}' if random.random() > 0.5 else '',
                    sujet=random.choice(software_sujets),
                    description=random.choice(software_descriptions),
                    commentaires='Résolu après redémarrage' if random.random() > 0.5 else '',
                )
                total_software_incidents += 1
                if i == 0 or i == incidents_count - 1:
                    self.stdout.write(f'  ✅ Created software incident #{incident.id} for year {year}')
        
        self.stdout.write(f'  ✅ Created {total_software_incidents} software incidents total')

        # Create some reports for software incidents
        software_incidents = SoftwareIncident.objects.all()[:15]  # Increased from 5 to 15
        for incident in software_incidents:
            report, created = Report.objects.get_or_create(
                software_incident=incident,
                defaults={
                    'date': incident.date,
                    'time': incident.time,
                    'anomaly': incident.description,
                    'analysis': f'Analyse approfondie de l\'incident #{incident.id}. Le problème a été identifié et résolu. Analyse technique détaillée des causes racines et des solutions appliquées.',
                    'conclusion': 'Incident résolu avec succès. Aucun impact sur les opérations. Recommandations de prévention mises en place.',
                }
            )
            if created:
                self.stdout.write(f'  ✅ Created report for software incident #{incident.id}')

        self.stdout.write(self.style.SUCCESS('\n✅ Test data created successfully!'))
        self.stdout.write(f'  - Equipment: {Equipement.objects.count()}')
        self.stdout.write(f'  - Hardware incidents: {HardwareIncident.objects.count()}')
        self.stdout.write(f'  - Software incidents: {SoftwareIncident.objects.count()}')
        self.stdout.write(f'  - Reports: {Report.objects.count()}')

