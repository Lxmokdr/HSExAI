# Guardian Backend

Django REST Framework backend for the Guardian Vision incident management system.

## Requirements

- Python 3.13 (or 3.8+)
- PostgreSQL 16 (or 12+)
- pip (Python package manager)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup

See `docs/POSTGRESQL_MIGRATION.md` for detailed PostgreSQL setup instructions.

Quick setup:
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE guardian_db;
CREATE USER guardian_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE guardian_db TO guardian_user;
\q
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run Migrations

```bash
./scripts/run_migrations_final.sh
```

### 5. Create Default Users

```bash
python manage.py create_default_users
```

### 6. Create Test Data (Optional)

```bash
./scripts/create_test_data.sh
```

### 7. Start Server

```bash
./scripts/run_django.sh runserver 8000
```

## Project Structure

```
backend/
├── api/                    # Django app
│   ├── models.py          # Database models
│   ├── views.py           # API views
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # API routes
│   └── management/        # Management commands
│       └── commands/
│           ├── create_default_users.py
│           └── create_test_data.py
├── core/          # Django project settings
│   ├── settings.py        # Main configuration
│   ├── urls.py            # Root URLs
│   └── wsgi.py            # WSGI config
├── scripts/               # Utility scripts
│   ├── create_test_data.sh
│   ├── run_django.sh
│   └── run_migrations_final.sh
├── docs/                  # Documentation
│   ├── POSTGRESQL_MIGRATION.md
│   └── ...
├── manage.py              # Django management
└── requirements.txt       # Python dependencies
```

## Management Commands

### Create Default Users
```bash
python manage.py create_default_users
```

### Create Test Data
```bash
python manage.py create_test_data
# Or with script:
./scripts/create_test_data.sh
```

### Run Migrations
```bash
python manage.py migrate
# Or with script:
./scripts/run_migrations_final.sh
```

## API Endpoints

All endpoints are prefixed with `/api/`:

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/profile/` - Get user profile

### Incidents
- `GET /api/incidents/` - List incidents
- `POST /api/incidents/` - Create incident
- `GET /api/incidents/stats/` - Get statistics
- `GET /api/incidents/recent/` - Get recent incidents
- `PUT /api/incidents/hardware/:id/` - Update hardware incident
- `PUT /api/incidents/software/:id/` - Update software incident
- `DELETE /api/incidents/:id/` - Delete incident

### Equipment
- `GET /api/equipement/` - List equipment
- `POST /api/equipement/` - Create equipment
- `PUT /api/equipement/:id/` - Update equipment
- `DELETE /api/equipement/:id/` - Delete equipment
- `GET /api/equipement/:id/history/` - Get equipment history

### Reports
- `GET /api/reports/` - List reports
- `POST /api/reports/` - Create/update report

## Default Users

All users have password: `01010101`

- `admin` (superuser)
- `technicien1`, `technicien2`
- `ingenieur1`, `ingenieur2`
- `chefdep1`
- `superuser1`

## Development

### Running Tests
```bash
python manage.py test
```

### Django Admin
Access at `http://localhost:8000/admin/` (after creating superuser):
```bash
python manage.py createsuperuser
```

## Documentation

- `docs/POSTGRESQL_MIGRATION.md` - PostgreSQL setup guide
- `docs/TEST_DATA_AND_HISTORY.md` - Test data and equipment history feature

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify `.env` file has correct credentials
- Check PostgreSQL logs: `sudo journalctl -u postgresql`

### Permission Issues
If running as postgres user, use the provided scripts in `scripts/` directory.
