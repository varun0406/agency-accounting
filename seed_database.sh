#!/bin/bash
set -e

echo "=========================================================="
echo "🌱 Running Agency Accounting Database Seed Script..."
echo "=========================================================="

cd "$(dirname "$0")/backend"

# Ensure dependencies are available
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Run the Prisma seed script
node prisma/seed.js

echo "✨ Seeding complete! You can now log in with:"
echo "   Username: admin"
echo "   Password: admin123"
echo "=========================================================="
