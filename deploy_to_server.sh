#!/bin/bash
# =========================================================================
# Agency Accounting System - Production Deployment Script
# =========================================================================
# Usage: ./deploy_to_server.sh
# 
# Make sure you have Node.js and npm installed on your server!
# Run: `sudo apt update && sudo apt install nodejs npm -y` (Ubuntu)
# =========================================================================

set -e # Exit immediately if a command exits with a non-zero status

# 1. Configuration
BACKEND_PORT=5000
# IMPORTANT: Change this to your server's actual IP or domain name!
# e.g., "http://your-server-ip:5000/api" or "https://yourdomain.com/api"
VITE_API_URL="https://karan.rovark.in/api"

echo "========================================"
echo "🚀 Deploying Agency Accounting System"
echo "========================================"

# 2. Build Frontend
echo "📦 1. Installing Frontend Dependencies and Building..."
cd frontend
npm install

# We pass the production API URL during the build step!
export VITE_API_URL=$VITE_API_URL
npm run build
cd ..

# 3. Setup Backend
echo "⚙️ 2. Setting up Backend..."
cd backend
npm install
npx prisma generate
npx prisma db push
cd ..

# 4. Install PM2 (Process Manager)
if ! command -v pm2 &> /dev/null
then
    echo "⬇️ PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
fi

# 5. Start Backend with PM2
echo "🔥 3. Starting Application via PM2 on Port $BACKEND_PORT..."
cd backend
# Stop the old process if it exists
pm2 stop agency-api 2>/dev/null || true

# Start the new process
PORT=$BACKEND_PORT pm2 start index.js --name "agency-api"

# Save the PM2 list so it automatically restarts on server reboot
pm2 save
pm2 startup | grep "sudo env PATH" | bash || true
cd ..

echo "========================================"
echo "✅ Deployment completed successfully!"
echo "Backend is running on port $BACKEND_PORT"
echo "To view PM2 logs, run: pm2 logs agency-api"
echo "========================================"
