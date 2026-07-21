#!/bin/bash
# Deploy SPYRO Auth Backend to VPS
# Run this from the VPS: bash deploy.sh

set -e

echo "🐉 Deploying SPYRO Auth Backend..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
bunx prisma generate

# Set up environment
if [ ! -f .env ]; then
  echo "📝 Creating .env from template..."
  cat > .env << 'ENV'
DATABASE_URL=postgresql://neondb_owner:npg_KaJnbm59NRHM@ep-silent-heart-ah1azq2h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
NODE_ENV=production
PORT=3001
ENV
fi

# Kill old process if running
echo "🛑 Stopping old process..."
pkill -f "bun index.ts" 2>/dev/null || true
sleep 1

# Start the server
echo "🚀 Starting server..."
nohup bun index.ts > auth-backend.log 2>&1 &
sleep 2

# Health check
echo "🏥 Health check..."
curl -s http://localhost:3001/api/health || echo "❌ Server not responding"

echo ""
echo "✅ SPYRO Auth Backend deployed on port 3001"
echo "   Add this nginx config to proxy /api/* to port 3001:"
echo ""
echo "   location /api/ {"
echo "       proxy_pass http://localhost:3001;"
echo "       proxy_set_header Host \$host;"
echo "       proxy_set_header X-Real-IP \$remote_addr;"
echo "   }"
