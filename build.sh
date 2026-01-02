#!/bin/bash
# Build script for Render deployment

set -e

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Creating data directories..."
mkdir -p /data/student_DB
mkdir -p /data

echo "Initializing JSON files if they don't exist..."
# Initialize users database
if [ ! -f /data/users_database.json ]; then
    echo '{"users": []}' > /data/users_database.json
fi

# Initialize teacher-student relations (in DATA_DIR, not backend directory)
if [ ! -f /data/teacher_student_relations.json ]; then
    echo '{"relations": [], "last_updated": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > /data/teacher_student_relations.json
fi

echo "Build completed successfully!"
