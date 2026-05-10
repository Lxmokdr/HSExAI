#!/bin/bash

# Guardian Vision - Startup Script
# This script starts all necessary services for the Guardian incident management system

echo "🚀 Starting Guardian Vision - Incident Management System"
echo "=================================================="

# If we're on Render, redirect to start_render.sh
# Render always sets PORT environment variable
# Also check for RENDER=true or if we're in a containerized environment
if [ -n "${PORT:-}" ] && [ -f "backend/start_render.sh" ]; then
    # Additional check: if RENDER is set, or if we're clearly in production
    if [ -n "${RENDER:-}" ] || [ "${NODE_ENV:-}" = "production" ] || [ ! -z "${DB_HOST:-}" ]; then
        echo "🔄 Render environment detected - using Render-specific startup script..."
        echo "   RENDER=${RENDER:-not set}, PORT=${PORT}, NODE_ENV=${NODE_ENV:-not set}"
        cd backend
        exec bash start_render.sh
    fi
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use (works in containerized environments)
check_port() {
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
            return 1
        else
            return 0
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":$1 "; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        return 1
    else
            return 0
        fi
    else
        # Can't check port, assume it's available
        return 0
    fi
}

# Function to kill process on port (works in containerized environments)
kill_port() {
    echo -e "${YELLOW}🔄 Killing process on port $1...${NC}"
    if command -v lsof &> /dev/null; then
        lsof -ti:$1 2>/dev/null | xargs kill -9 2>/dev/null || true
    elif command -v fuser &> /dev/null; then
        fuser -k $1/tcp 2>/dev/null || true
    else
        # Can't kill, just continue
        echo -e "${YELLOW}   (Port cleanup tools not available, continuing...)${NC}"
    fi
    sleep 2
}

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python $(python3 --version) detected${NC}"

# Check if Node.js is installed (for frontend)
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"

# Install dependencies if needed
echo -e "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}🔄 Installing frontend dependencies...${NC}"
    npm install
fi

# Setup Django backend if needed
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}🔄 Setting up Django backend...${NC}"
    cd backend
    bash setup_django.sh
    cd ..
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"

# Kill existing processes on required ports
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
kill_port 8001  # Backend
kill_port 8080  # Frontend

# Start Django Backend
echo -e "${BLUE}🔧 Starting Django Backend Server...${NC}"

# Load environment variables from .env BEFORE changing directory
if [ -f "backend/.env" ]; then
    # Source the .env file properly (handle comments and empty lines)
    set -a
    source <(grep -v '^#' backend/.env | grep -v '^$' | sed 's/^/export /')
    set +a
fi

# Change to backend directory
    cd backend
    
    # Determine Python command
    if [ -d "venv" ]; then
        PYTHON_CMD="$(pwd)/venv/bin/python"
    else
        PYTHON_CMD=python3
    fi
    
    # Check if Django is set up
    if [ ! -f "manage.py" ]; then
        echo -e "${YELLOW}🔄 Django backend not set up, running setup...${NC}"
        bash setup_django.sh
    fi

# Determine database backend
USE_SQLITE=${USE_SQLITE:-true}  # Default to SQLite for local development
DB_PASSWORD=${DB_PASSWORD:-}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Export USE_SQLITE to Django
export USE_SQLITE

if [ "$USE_SQLITE" = "true" ] || [ "$USE_SQLITE" = "True" ]; then
    # SQLite for local development - simple setup
    echo -e "${GREEN}✅ Using SQLite database for local development${NC}"
    
    SERVER_PORT=${PORT:-8000}
    $PYTHON_CMD manage.py runserver 0.0.0.0:$SERVER_PORT &
    BACKEND_PID=$!
else
    # PostgreSQL configuration
    echo -e "${BLUE}🗄️  Using PostgreSQL database${NC}"
    
    # Check if password is empty, default, or just whitespace
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "guardian_password" ] || [ -z "${DB_PASSWORD// }" ]; then
        # Check if we're in a containerized environment (no sudo available)
        if ! command -v sudo &> /dev/null || [ "$DB_HOST" != "localhost" ]; then
            # Containerized environment - use environment variables
            echo -e "${YELLOW}⚠️  Containerized environment detected${NC}"
            echo -e "${YELLOW}   Using environment variables for database connection${NC}"
            # Export all database environment variables
            export DB_PASSWORD DB_USER DB_NAME DB_HOST DB_PORT
            $PYTHON_CMD manage.py runserver 0.0.0.0:8000 &
            BACKEND_PID=$!
        elif command -v sudo &> /dev/null; then
            # Local development - try peer authentication with sudo
            echo -e "${YELLOW}⚠️  Database password not configured. Attempting peer authentication...${NC}"
            echo -e "${YELLOW}   This requires sudo access.${NC}"
        
            # Try to run with sudo (test if passwordless sudo works for postgres user)
            if sudo -n -u postgres true 2>/dev/null; then
                # Passwordless sudo available
                echo -e "${GREEN}✅ Using passwordless sudo for peer authentication${NC}"
                SERVER_PORT=${PORT:-8001}
                sudo -E -u postgres env PATH="$PATH" "$PYTHON_CMD" manage.py runserver 0.0.0.0:$SERVER_PORT &
                BACKEND_PID=$!
            else
                # Try running anyway - might work with passwordless sudo configured
                echo -e "${YELLOW}⚠️  Attempting to use sudo (passwordless sudo may be configured)...${NC}"
                SERVER_PORT=${PORT:-8001}
                if sudo -E -u postgres env PATH="$PATH" "$PYTHON_CMD" manage.py runserver 0.0.0.0:$SERVER_PORT & 2>/dev/null; then
                    BACKEND_PID=$!
                    sleep 2
                    if ! kill -0 $BACKEND_PID 2>/dev/null; then
                        echo -e "${RED}❌ Sudo failed. Please configure passwordless sudo or set DB_PASSWORD${NC}"
                        cd ..
                        exit 1
                    fi
                else
                    echo -e "${RED}❌ Sudo not available. Please set DB_PASSWORD environment variable${NC}"
                    cd ..
                    exit 1
                fi
            fi
        else
            # No sudo available - use environment variables
            echo -e "${YELLOW}⚠️  Sudo not available. Using environment variables${NC}"
            export DB_PASSWORD DB_USER DB_NAME DB_HOST DB_PORT
            SERVER_PORT=${PORT:-8001}
            $PYTHON_CMD manage.py runserver 0.0.0.0:$SERVER_PORT &
            BACKEND_PID=$!
        fi
    else
        # Using password authentication, run as current user
        echo -e "${GREEN}✅ Using password authentication${NC}"
        
        # Export environment variables for Django
        export DB_PASSWORD DB_USER DB_NAME DB_HOST DB_PORT
        
        # Use PORT environment variable if set (Render, Heroku, etc.), otherwise default to 8001
        SERVER_PORT=${PORT:-8001}
        $PYTHON_CMD manage.py runserver 0.0.0.0:$SERVER_PORT &
        BACKEND_PID=$!
    fi
fi

cd ..

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running (with fallback if curl not available)
SERVER_PORT=${PORT:-8000}
if command -v curl &> /dev/null; then
    if curl -s http://localhost:$SERVER_PORT/api/health/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend running on http://localhost:$SERVER_PORT${NC}"
else
        echo -e "${YELLOW}⚠️  Backend health check failed, but process is running${NC}"
        echo -e "${YELLOW}   (This may be normal during startup)${NC}"
    fi
else
    # curl not available, just check if process is running
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Backend process running on port $SERVER_PORT (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}❌ Backend process failed to start${NC}"
    exit 1
    fi
fi

# Start Frontend (only if not in production mode)
if [ "${NODE_ENV}" != "production" ] && [ -z "${SKIP_FRONTEND:-}" ]; then
echo -e "${BLUE}⚛️  Starting Frontend Development Server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 5

    # Check if frontend is running (with fallback if curl not available)
    if command -v curl &> /dev/null; then
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend running on http://localhost:8080${NC}"
else
            echo -e "${YELLOW}⚠️  Frontend health check failed, but process is running${NC}"
        fi
    else
        # curl not available, just check if process is running
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${GREEN}✅ Frontend process running (PID: $FRONTEND_PID)${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend process check failed (may be normal)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Skipping frontend (production mode or SKIP_FRONTEND set)${NC}"
    FRONTEND_PID=""
fi

echo ""
echo -e "${GREEN}🎉 Guardian Vision is now running!${NC}"
echo "=================================================="
if [ -z "${SKIP_FRONTEND:-}" ] && [ "${NODE_ENV}" != "production" ]; then
echo -e "${BLUE}📱 Frontend:${NC}     http://localhost:8080"
fi
echo -e "${BLUE}🔧 Backend API:${NC}   http://localhost:${SERVER_PORT:-8001} (Django)"
echo ""
echo -e "${YELLOW}👥 Default Users (Password: 01010101):${NC}"
echo "   • technicien1, technicien2"
echo "   • ingenieur1, ingenieur2" 
echo "   • chefdep1, superuser1, admin"
echo ""
echo -e "${YELLOW}🛑 To stop all services:${NC}"
echo "   Press Ctrl+C or run: ./stop.sh"
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping Guardian Vision services...${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    kill $DB_VIEWER_PID 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
echo -e "${GREEN}✨ All services are running. Press Ctrl+C to stop.${NC}"
wait
