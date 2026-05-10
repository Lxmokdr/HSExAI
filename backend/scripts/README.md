# Utility Scripts

This directory contains utility scripts for managing the Guardian backend.

## Available Scripts

### `create_test_data.sh`
Creates sample data for testing the dashboard and features.

**Usage:**
```bash
./scripts/create_test_data.sh
./scripts/create_test_data.sh --clear  # Clear existing data first
```

### `run_django.sh`
Runs Django management commands as the postgres user (for peer authentication).

**Usage:**
```bash
./scripts/run_django.sh runserver 8000
./scripts/run_django.sh migrate
./scripts/run_django.sh createsuperuser
```

### `run_migrations_final.sh`
Runs database migrations and creates default users.

**Usage:**
```bash
./scripts/run_migrations_final.sh
```

## Archived Scripts

Temporary migration and troubleshooting scripts have been moved to `scripts/archive/` for reference. These were used during the PostgreSQL migration process and are no longer needed for normal operation.

