"""
Management command to fix anomaly type values in SoftwareIncident model.
Replaces 'Systeme' with 'systematique' and normalizes other variations.
"""
from django.core.management.base import BaseCommand
from api.models import SoftwareIncident


class Command(BaseCommand):
    help = 'Fix anomaly type values: replace Systeme with systematique and normalize variations'

    def handle(self, *args, **options):
        # Count before
        total_incidents = SoftwareIncident.objects.count()
        incidents_with_anomaly = SoftwareIncident.objects.exclude(type_d_anomalie__isnull=True).exclude(type_d_anomalie='')
        
        self.stdout.write(f'Total incidents: {total_incidents}')
        self.stdout.write(f'Incidents with anomaly type: {incidents_with_anomaly.count()}')
        
        # Fix Systeme -> systematique
        systeme_count = SoftwareIncident.objects.filter(type_d_anomalie__iexact='Systeme').count()
        if systeme_count > 0:
            SoftwareIncident.objects.filter(type_d_anomalie__iexact='Systeme').update(type_d_anomalie='systematique')
            self.stdout.write(self.style.SUCCESS(f'✓ Fixed {systeme_count} incidents: Systeme -> systematique'))
        
        # Fix Systématique -> systematique (with accent)
        systematique_accent_count = SoftwareIncident.objects.filter(type_d_anomalie__iexact='Systématique').count()
        if systematique_accent_count > 0:
            SoftwareIncident.objects.filter(type_d_anomalie__iexact='Systématique').update(type_d_anomalie='systematique')
            self.stdout.write(self.style.SUCCESS(f'✓ Fixed {systematique_accent_count} incidents: Systématique -> systematique'))
        
        # Fix systematique (already correct but ensure consistency)
        systematique_lower_count = SoftwareIncident.objects.filter(type_d_anomalie__iexact='systematique').count()
        if systematique_lower_count > 0:
            SoftwareIncident.objects.filter(type_d_anomalie__iexact='systematique').update(type_d_anomalie='systematique')
            self.stdout.write(self.style.SUCCESS(f'✓ Normalized {systematique_lower_count} incidents: systematique (already correct)'))
        
        # Fix Aléatoire -> aleatoire (with accent)
        aleatoire_accent_count = SoftwareIncident.objects.filter(type_d_anomalie__iexact='Aléatoire').count()
        if aleatoire_accent_count > 0:
            SoftwareIncident.objects.filter(type_d_anomalie__iexact='Aléatoire').update(type_d_anomalie='aleatoire')
            self.stdout.write(self.style.SUCCESS(f'✓ Fixed {aleatoire_accent_count} incidents: Aléatoire -> aleatoire'))
        
        # Show summary
        after_systematique = SoftwareIncident.objects.filter(type_d_anomalie__iexact='systematique').count()
        after_aleatoire = SoftwareIncident.objects.filter(type_d_anomalie__iexact='aleatoire').count()
        
        self.stdout.write(self.style.SUCCESS('\nSummary:'))
        self.stdout.write(f'  Systématique: {after_systematique}')
        self.stdout.write(f'  Aléatoire: {after_aleatoire}')
        self.stdout.write(self.style.SUCCESS('\n✓ All anomaly types have been normalized!'))
