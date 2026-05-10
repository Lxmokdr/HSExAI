#!/bin/bash

# Script to set up PostgreSQL password authentication
# Run this ONCE with: sudo ./setup_db_password.sh

echo "🔧 Setting up PostgreSQL password authentication..."
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script must be run with sudo"
    echo "   Run: sudo ./setup_db_password.sh"
    exit 1
fi

# Set password for postgres user
PASSWORD="guardian_db_pass"
echo "Setting password for postgres user..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$PASSWORD';"

if [ $? -eq 0 ]; then
    echo "✅ Password set successfully"
    echo ""
    
    # Update .env file (run as original user)
    SUDO_USER=${SUDO_USER:-$USER}
    if [ -f ".env" ]; then
        echo "Updating .env file..."
        # Use the original user to update the file
        sudo -u "$SUDO_USER" sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$PASSWORD/" .env
        sudo -u "$SUDO_USER" sed -i "s/^DB_PORT=.*/DB_PORT=5432/" .env
        echo "✅ .env file updated"
        echo ""
        echo "Password: $PASSWORD"
        echo "You can now run ./start.sh without sudo!"
    else
        echo "⚠️  .env file not found, but password is set"
        echo "   Add to .env: DB_PASSWORD=$PASSWORD"
    fi
else
    echo "❌ Failed to set password"
    exit 1
fi

