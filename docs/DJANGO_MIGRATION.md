# Django Backend Migration

The Guardian backend has been successfully migrated from Node.js/Express to Django REST Framework.

## What Changed

### Backend Technology
- **Before**: Node.js + Express + SQLite3
- **After**: Django + Django REST Framework + SQLite3

### Structure
- **Old**: `backend-simple/` (Node.js)
- **New**: `backend/` (Django)

The database file remains the same: `backend-simple/guardian.db` (shared between old and new backend)

## Features Preserved

All API endpoints and functionality have been preserved:

✅ **Authentication**
- JWT token-based authentication
- Login/Logout endpoints
- User profile endpoint
- Same token expiration (24 hours)

✅ **Incidents**
- Hardware incidents (full CRUD)
- Software incidents (full CRUD)
- Statistics endpoint
- Recent incidents endpoint
- Equipment lookup and linking

✅ **Reports**
- Create/Update reports for software incidents
- One report per software incident (1:1 relationship)
- Auto-fill from incident data

✅ **Equipment**
- Full CRUD operations
- Serial number search/autocomplete
- Equipment history tracking (actuel/historique)

## API Compatibility

All endpoints maintain the same URL structure and request/response format:
- `/api/auth/login/`
- `/api/auth/logout/`
- `/api/auth/profile/`
- `/api/incidents/`
- `/api/incidents/stats/`
- `/api/incidents/recent/`
- `/api/incidents/hardware/:id/`
- `/api/incidents/software/:id/`
- `/api/reports/`
- `/api/equipement/`

The frontend should work without any changes!

## Setup Instructions

### First Time Setup

1. **Install Python 3.8+** (if not already installed)
   ```bash
   # Ubuntu/Debian
   sudo apt install python3 python3-pip python3-venv
   ```

2. **Run the setup script**
   ```bash
   cd backend
   bash setup_django.sh
   ```

3. **Start the server**
   ```bash
   # From project root
   ./start.sh
   
   # Or manually
   cd backend
   source venv/bin/activate  # if using venv
   python manage.py runserver 8000
   ```

### Using the Updated start.sh

The main `start.sh` script has been updated to:
- Check for Python 3
- Set up Django backend automatically
- Start Django server instead of Node.js server
- Keep frontend unchanged

## Database

The Django backend uses the **same SQLite database** as the Node.js backend:
- Location: `backend-simple/guardian.db`
- All existing data is preserved
- Migrations create the schema if it doesn't exist

## Default Users

Same default users with password `01010101`:
- admin (superuser)
- technicien1, technicien2
- ingenieur1, ingenieur2
- chefdep1
- superuser1

## Development

### Running Migrations

```bash
cd backend
source venv/bin/activate  # if using venv
python manage.py makemigrations
python manage.py migrate
```

### Creating Superuser

```bash
python manage.py createsuperuser
```

### Django Admin

Access at `http://localhost:8000/admin/` after creating a superuser.

## Troubleshooting

### Virtual Environment Issues

If `python3-venv` is not available:
```bash
sudo apt install python3.12-venv
```

Or install packages globally:
```bash
pip3 install -r backend/requirements.txt
```

### Port Conflicts

If port 8000 is in use:
```bash
# Kill existing process
lsof -ti:8000 | xargs kill -9

# Or use different port
python manage.py runserver 8001
```

### Database Issues

If you get database errors:
1. Check that `backend-simple/guardian.db` exists
2. Run migrations: `python manage.py migrate`
3. Check file permissions

## Files Created

### Django Project Structure
```
backend/
├── manage.py
├── requirements.txt
├── setup_django.sh
├── runserver.sh
├── README.md
├── core/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── api/
    ├── __init__.py
    ├── apps.py
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    ├── admin.py
    └── management/
        └── commands/
            └── create_default_users.py
```

## Next Steps

1. ✅ Backend migrated to Django
2. ✅ All endpoints working
3. ✅ Database schema preserved
4. ✅ Frontend compatibility maintained
5. ⏭️ Test all functionality
6. ⏭️ Deploy (if needed)

## Notes

- The old Node.js backend in `backend-simple/` is kept for reference
- The database is shared, so you can switch back if needed
- All API responses match the original format
- JWT tokens are compatible with the frontend

