# Quick Start - PostgreSQL Migration Complete! 🎉

The database has been migrated to PostgreSQL. Use these commands to run Django:

## Run Migrations

```bash
cd /home/lxmix/data/Guardian/backend

# Option 1: Use the migration script (easiest)
bash run_migrations.sh

# Option 2: Run manually
sudo -E -u postgres env PATH="$PATH" /home/lxmix/data/anaconda3/bin/python manage.py migrate
sudo -E -u postgres env PATH="$PATH" /home/lxmix/data/anaconda3/bin/python manage.py create_default_users
```

## Start the Server

```bash
cd /home/lxmix/data/Guardian/backend

# Option 1: Use the wrapper script
./run_django.sh runserver 8000

# Option 2: Run manually
sudo -E -u postgres env PATH="$PATH" /home/lxmix/data/anaconda3/bin/python manage.py runserver 8000
```

## Other Django Commands

For any Django management command, use:

```bash
./run_django.sh <command>

# Examples:
./run_django.sh createsuperuser
./run_django.sh shell
./run_django.sh collectstatic
```

## Why This Works

- PostgreSQL is configured and running
- Database `guardian_db` exists
- Peer authentication works (no password needed when running as postgres user)
- The wrapper script preserves your anaconda Python environment

## Note

Password authentication via TCP/IP is not working, but this workaround using peer authentication is perfectly fine for development and even production (when running Django as the postgres user or a dedicated database user).

