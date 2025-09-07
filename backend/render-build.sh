#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit  # Exit on error

echo "Starting Render build process..."
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"

# Upgrade pip
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create database tables
echo "Creating database tables..."
python -c "
import os
import sys
sys.path.append('.')
try:
    from app.database import engine, Base
    Base.metadata.create_all(bind=engine)
    print('✅ Database tables created successfully')
except Exception as e:
    print(f'❌ Database creation error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
"

echo "✅ Build completed successfully!"