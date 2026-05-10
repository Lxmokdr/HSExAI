#!/bin/bash

# Render.com startup script for Django backend
# This script is optimized for containerized environments

# Don't exit on error for user creation - we want the server to start even if users fail
set +e

echo "🚀 Starting Guardian Backend on Render..."
echo "======================================"

# Debug: Show current directory and what's available
echo "📂 Current directory: $(pwd)"
echo "📂 Contents: $(ls -la | head -10)"

# Activate virtual environment
# Check multiple possible locations for venv
VENV_FOUND=false
if [ -d "venv" ] && [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    PYTHON_CMD="venv/bin/python"
    VENV_FOUND=true
    echo "✅ Using virtual environment: ./venv"
elif [ -d "../venv" ] && [ -f "../venv/bin/activate" ]; then
    source ../venv/bin/activate
    PYTHON_CMD="../venv/bin/python"
    VENV_FOUND=true
    echo "✅ Using virtual environment: ../venv"
elif [ -d "/opt/render/project/src/backend/venv" ] && [ -f "/opt/render/project/src/backend/venv/bin/activate" ]; then
    source /opt/render/project/src/backend/venv/bin/activate
    PYTHON_CMD="/opt/render/project/src/backend/venv/bin/python"
    VENV_FOUND=true
    echo "✅ Using virtual environment: /opt/render/project/src/backend/venv"
fi

if [ "$VENV_FOUND" = false ]; then
    echo "⚠️  No virtual environment found!"
    echo "   Current directory: $(pwd)"
    echo "   Looking for venv in:"
    echo "     - ./venv ($([ -d "venv" ] && echo "EXISTS" || echo "NOT FOUND"))"
    echo "     - ../venv ($([ -d "../venv" ] && echo "EXISTS" || echo "NOT FOUND"))"
    echo "     - /opt/render/project/src/backend/venv ($([ -d "/opt/render/project/src/backend/venv" ] && echo "EXISTS" || echo "NOT FOUND"))"
    echo ""
    echo "   Attempting to recreate venv and install dependencies..."
    
    # Try to create venv and install dependencies
    if python3 -m venv venv 2>/dev/null; then
        source venv/bin/activate
        echo "   ✅ Created new virtual environment"
        echo "   📦 Installing dependencies from requirements.txt..."
        pip install --upgrade pip >/dev/null 2>&1
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt >/dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo "   ✅ Dependencies installed successfully"
                PYTHON_CMD="venv/bin/python"
                VENV_FOUND=true
            else
                echo "   ❌ Failed to install dependencies"
            fi
        else
            echo "   ❌ requirements.txt not found!"
        fi
    else
        echo "   ❌ Failed to create virtual environment"
    fi
    
    # If still no venv, try system Python
    if [ "$VENV_FOUND" = false ]; then
        echo "   Trying to use system Python..."
        PYTHON_CMD="python3"
        
        # Verify Django is available
        if python3 -c "import django" 2>/dev/null; then
            echo "   ✅ Django is available in system Python"
        else
            echo "   ❌ ERROR: Django is NOT available in system Python!"
            echo "   The build process must have failed to create the venv or install dependencies."
            echo "   Please check the build logs."
            exit 1
        fi
    fi
fi

# Export all database environment variables (Render sets these automatically)
export DB_PASSWORD DB_USER DB_NAME DB_HOST DB_PORT

echo "📊 Database configuration:"
echo "   DB_HOST: ${DB_HOST:-NOT SET}"
echo "   DB_NAME: ${DB_NAME:-NOT SET}"
echo "   DB_USER: ${DB_USER:-NOT SET}"
echo "   DB_PORT: ${DB_PORT:-NOT SET}"
echo "   DB_PASSWORD: ${DB_PASSWORD:+SET (hidden)}"

# Run migrations
echo ""
echo "🔄 Running database migrations..."
$PYTHON_CMD manage.py migrate --no-input
MIGRATION_STATUS=$?
if [ $MIGRATION_STATUS -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️  Migration failed (exit code: $MIGRATION_STATUS), but continuing..."
fi

# Create default users (CRITICAL - must succeed for app to work)
echo ""
echo "👥 Creating/updating default users..."
echo "   This is required for the application to work!"
$PYTHON_CMD manage.py create_default_users
USER_CREATION_STATUS=$?
if [ $USER_CREATION_STATUS -eq 0 ]; then
    echo "✅ Default users created/updated successfully"
    echo "   Default password for all users: 01010101"
else
    echo "❌ ERROR: User creation failed (exit code: $USER_CREATION_STATUS)"
    echo "   The application may not work correctly!"
    echo "   Users: admin, technicien1, technicien2, ingenieur1, ingenieur2, chefdep1, superuser1"
    echo "   Password: 01010101"
    echo ""
    echo "   To create users manually, use Render Shell:"
    echo "   cd backend && source venv/bin/activate && python manage.py create_default_users"
fi

# Start server on the port Render provides
echo ""
SERVER_PORT=${PORT:-8000}
echo "✅ Starting Django server on port $SERVER_PORT..."
echo "   Backend will be available at: https://guardian-vision.onrender.com"
echo ""
set -e  # Exit on error for server startup
exec $PYTHON_CMD manage.py runserver 0.0.0.0:$SERVER_PORT
