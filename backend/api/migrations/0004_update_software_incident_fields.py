# Generated migration for updating SoftwareIncident fields
# - Remove simulateur and salle_operationnelle fields
# - Rename position_STA to position
# - Rename indicatif to call_sign
# - Update nom_radar to use choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_update_roles_and_add_lockout'),
    ]

    operations = [
        # Remove simulateur field
        migrations.RemoveField(
            model_name='softwareincident',
            name='simulateur',
        ),
        # Remove salle_operationnelle field
        migrations.RemoveField(
            model_name='softwareincident',
            name='salle_operationnelle',
        ),
        # Rename position_STA to position
        migrations.RenameField(
            model_name='softwareincident',
            old_name='position_STA',
            new_name='position',
        ),
        # Rename indicatif to call_sign
        migrations.RenameField(
            model_name='softwareincident',
            old_name='indicatif',
            new_name='call_sign',
        ),
        # Update nom_radar to use choices
        migrations.AlterField(
            model_name='softwareincident',
            name='nom_radar',
            field=models.CharField(
                blank=True,
                choices=[('OS', 'OS'), ('MG', 'MG'), ('SD', 'SD'), ('LO', 'LO'), ('BY', 'BY')],
                max_length=10,
                null=True
            ),
        ),
    ]
