#!/bin/bash

# Django Backend Setup Script
# This script sets up the Django backend for Guardian

echo "🔧 Setting up Django Backend for Guardian"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    echo -e "${YELLOW}   Install with: sudo apt install python3 python3-pip${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python $(python3 --version) detected${NC}"

# Check if pip3 is available
if ! command -v pip3 &> /dev/null && ! python3 -m pip --version &> /dev/null; then
    echo -e "${RED}❌ pip3 is not installed${NC}"
    echo -e "${YELLOW}   Install with: sudo apt install python3-pip${NC}"
    echo -e "${YELLOW}   Or use: python3 -m ensurepip --upgrade${NC}"
    exit 1
fi

# Determine pip command
if command -v pip3 &> /dev/null; then
    PIP_CMD=pip3
elif python3 -m pip --version &> /dev/null; then
    PIP_CMD="python3 -m pip"
else
    echo -e "${RED}❌ Cannot find pip. Please install python3-pip${NC}"
    exit 1
fi

echo -e "${GREEN}✅ pip available${NC}"

# Check if virtual environment exists or can be created
USE_VENV=false
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}🔄 Attempting to create virtual environment...${NC}"
    # Try creating venv with pip first
    if python3 -m venv venv 2>/dev/null && [ -f "venv/bin/activate" ]; then
        echo -e "${GREEN}✅ Virtual environment created${NC}"
        USE_VENV=true
    # If that fails, try creating venv without pip and install pip manually
    elif python3 -m venv --without-pip venv 2>/dev/null && [ -f "venv/bin/activate" ]; then
        echo -e "${YELLOW}⚠️  Created venv without pip, installing pip manually...${NC}"
        source venv/bin/activate
        curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
        python /tmp/get-pip.py >/dev/null 2>&1
        rm -f /tmp/get-pip.py
        echo -e "${GREEN}✅ Virtual environment created with pip${NC}"
        USE_VENV=true
    else
        echo -e "${YELLOW}⚠️  Cannot create virtual environment (python3-venv may not be installed)${NC}"
        echo -e "${YELLOW}   Installing packages with --user flag instead...${NC}"
        echo -e "${YELLOW}   To use venv, install: sudo apt install python3-venv${NC}"
        USE_VENV=false
    fi
elif [ -f "venv/bin/activate" ]; then
    USE_VENV=true
fi

# Activate virtual environment if it exists
if [ "$USE_VENV" = true ] && [ -f "venv/bin/activate" ]; then
    echo -e "${BLUE}📦 Activating virtual environment...${NC}"
    source venv/bin/activate
    PYTHON_CMD=python
    PIP_CMD=pip
else
    PYTHON_CMD=python3
    if command -v pip3 &> /dev/null; then
        PIP_CMD="pip3 install --user"
    else
        PIP_CMD="python3 -m pip install --user"
    fi
fi

# Install dependencies
echo -e "${YELLOW}🔄 Installing dependencies...${NC}"
if [ "$USE_VENV" = true ]; then
    pip install --upgrade pip -q
    if pip install -r requirements.txt setuptools; then
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
else
    # Install with --user flag
    if $PIP_CMD --upgrade pip -q 2>/dev/null; then
        echo -e "${GREEN}✅ pip upgraded${NC}"
    fi
    if $PIP_CMD -r requirements.txt setuptools; then
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        echo -e "${YELLOW}   Try: sudo apt install python3-pip${NC}"
        echo -e "${YELLOW}   Then: $PIP_CMD -r requirements.txt${NC}"
        exit 1
    fi
fi

# Run migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
# Set database user to postgres for peer authentication if password is not set
# In containerized environments, these should be set via environment variables
export DB_USER=${DB_USER:-postgres}
export DB_PASSWORD=${DB_PASSWORD:-}
export DB_NAME=${DB_NAME:-guardian_db}
export DB_HOST=${DB_HOST:-localhost}
export DB_PORT=${DB_PORT:-5432}

# Check if we're in a containerized environment (no sudo, DB_HOST not localhost)
if [ -z "$DB_PASSWORD" ] && [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "127.0.0.1" ]; then
    echo -e "${RED}❌ Error: DB_PASSWORD must be set when DB_HOST is not localhost${NC}"
    echo -e "${YELLOW}   Please set DB_PASSWORD environment variable${NC}"
    exit 1
fi

if $PYTHON_CMD manage.py makemigrations --no-input 2>/dev/null; then
    echo -e "${GREEN}✅ Migrations created${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Failed to create migrations (may be normal if no changes)${NC}"
fi

if $PYTHON_CMD manage.py migrate --no-input; then
    echo -e "${GREEN}✅ Database migrated${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Failed to run migrations${NC}"
    if [ -z "$DB_PASSWORD" ] && command -v sudo &> /dev/null; then
        echo -e "${YELLOW}   You may need to run migrations as postgres user${NC}"
    else
        echo -e "${YELLOW}   Check database connection settings${NC}"
    fi
fi

# Create default users (skip in production/containerized environments)
if [ "${SKIP_DEFAULT_USERS:-}" != "true" ] && [ -z "${RENDER:-}" ]; then
echo -e "${BLUE}👥 Creating default users...${NC}"
    if $PYTHON_CMD manage.py create_default_users 2>/dev/null; then
    echo -e "${GREEN}✅ Default users created${NC}"
else
        echo -e "${YELLOW}⚠️  Warning: Failed to create default users${NC}"
        if [ -z "$DB_PASSWORD" ] && command -v sudo &> /dev/null; then
            echo -e "${YELLOW}   You may need to run as postgres user${NC}"
        fi
    echo -e "${YELLOW}   You can create users manually later${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping default user creation (containerized environment)${NC}"
    echo -e "${YELLOW}   Create users manually via Django admin or management command${NC}"
fi

echo ""
echo -e "${GREEN}✅ Django backend setup complete!${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
if [ "$USE_VENV" = true ] && [ -d "venv" ]; then
    echo "   1. Activate venv: source venv/bin/activate"
    echo "   2. Run: python manage.py runserver 8000"
else
    echo "   1. Run: python3 manage.py runserver 8000"
fi
echo "   2. Or use: ./start.sh (from project root)"

