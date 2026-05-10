# Code Structure Cleanup Summary

This document summarizes the code organization and cleanup performed on the Guardian Vision project.

## Files Removed

### Old Node.js Backend Files
- `backend-simple/server.js` - Old Express server (replaced by Django)
- `backend-simple/db-viewer.js` - CLI database viewer (no longer needed)
- `backend-simple/db-web-viewer.js` - Web database viewer (no longer needed)
- `backend-simple/package.json` - Old Node.js dependencies
- `backend-simple/package-lock.json` - Old dependency lock file
- `backend-simple/server.log` - Old server log file
- `backend-simple/migrate-*.js` - All migration scripts (5 files)
- `backend-simple/node_modules/` - Old Node.js dependencies directory

**Note:** `backend-simple/guardian.db` is kept as it contains the shared database.

### Temporary Documentation Files
Moved to `docs/archive/`:
- `FINAL_FIX_400.md`
- `FIX_400_ERROR.md`
- `FIX_VITE_CACHE.md`
- `FIXES_APPLIED.md`
- `TROUBLESHOOTING_400.md`
- `QUICK_START.md`
- `STATUS.md`
- `GMT_UTC_VERIFICATION.md`

### Duplicate Files
- `src/components/ui/use-toast.ts` - Duplicate (re-exported from `src/hooks/use-toast.ts`)

## Files Organized

### Documentation Structure
```
docs/
├── DJANGO_MIGRATION.md          # Django migration guide
├── CONCEPTION_INTERFACE.md       # UI design documentation
├── VERIFICATION_CHAMPS.md        # Field verification documentation
└── archive/                      # Historical/temporary docs
    └── [8 archived files]
```

## Code Cleanup

### Package.json Scripts
**Removed:**
- `"backend": "cd backend-simple && node server.js"`
- `"db-viewer": "cd backend-simple && node db-web-viewer.js"`
- `"db-cli": "cd backend-simple && node db-viewer.js"`

**Kept:**
- `"start": "./start.sh"`
- `"stop": "./stop.sh"`
- `"setup": "./setup.sh"`

### Dependencies
**Removed unused dependencies:**
- `@hookform/resolvers` - Not used (no react-hook-form)
- `cmdk` - Not used (no command menu component)

**Kept:**
- `@tanstack/react-query` - Set up as provider (may be used for future caching)

### Scripts Updated
- `setup.sh` - Updated to use Django backend setup instead of Node.js
- `stop.sh` - Removed references to old Node.js processes
- `start.sh` - Removed DB viewer port cleanup

## Updated Documentation

### README.md
- Updated badges to reflect Django backend
- Updated architecture section with Django structure
- Updated installation instructions for Django
- Updated manual startup instructions

### .gitignore
- Added Python/Django ignore patterns
- Added `__pycache__/` directories
- Added virtual environment directories
- Added Django-specific files

## Current Structure

```
Guardian/
├── backend/                    # Django backend
│   ├── api/                    # API application
│   ├── core/           # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── setup_django.sh
├── backend-simple/             # Legacy (database only)
│   └── guardian.db                # Shared SQLite database
├── src/                        # React frontend
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
├── docs/                       # Documentation
│   ├── DJANGO_MIGRATION.md
│   ├── CONCEPTION_INTERFACE.md
│   ├── VERIFICATION_CHAMPS.md
│   └── archive/
├── README.md                   # Main documentation
├── start.sh                    # Startup script
├── stop.sh                     # Stop script
├── setup.sh                    # Setup script
└── package.json                # Frontend dependencies
```

## Benefits

1. **Cleaner Structure**: Removed all unused Node.js backend files
2. **Better Organization**: Documentation consolidated in `docs/`
3. **Reduced Dependencies**: Removed unused npm packages
4. **Updated Scripts**: All scripts now reflect Django backend
5. **Better Git Ignore**: Proper Python/Django patterns added

## Next Steps (Optional)

1. Consider removing `@tanstack/react-query` if not planning to use it
2. Archive or remove `backend-simple/` directory entirely (keep only `guardian.db`)
3. Consider moving `guardian.db` to a `data/` directory for better organization

