from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


class Command(BaseCommand):
    help = 'Create default users for Guardian system'

    def handle(self, *args, **options):
        default_password = '01010101'
        users = [
            {'username': 'admin', 'role': 'superadmin'},
            {'username': 'technicien1', 'role': 'service_maintenance'},
            {'username': 'technicien2', 'role': 'service_maintenance'},
            {'username': 'ingenieur1', 'role': 'service_integration'},
            {'username': 'ingenieur2', 'role': 'service_integration'},
            {'username': 'chefdep1', 'role': 'chef_departement'},
            {'username': 'superuser1', 'role': 'superadmin'},
        ]
        
        created_count = 0
        skipped_count = 0
        
        for user_data in users:
            try:
                user, created = User.objects.get_or_create(
                    username=user_data['username'],
                    defaults={
                        'role': user_data['role'],
                        'is_staff': user_data['role'] == 'superadmin',
                        'is_superuser': user_data['role'] == 'superadmin',
                    }
                )
                if created:
                    user.set_password(default_password)
                    user.save()
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Created user: {user_data["username"]} (password: {default_password})')
                    )
                else:
                    # Update password if user exists but password might be wrong
                    # This ensures existing users have the correct default password
                    user.set_password(default_password)
                    user.save()
                    skipped_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'⏭️  User already exists: {user_data["username"]} (password reset to: {default_password})')
                    )
            except IntegrityError:
                skipped_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⏭️  User already exists: {user_data["username"]}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✨ Default users setup complete! '
                f'Created: {created_count}, Skipped: {skipped_count}'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(f'📝 Default password for all users: {default_password}')
        )

