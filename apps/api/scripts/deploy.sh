#!/bin/bash

# Production deployment script for Campus Connect API

echo "🚀 Starting Campus Connect API deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
pnpm build

# Run database migrations (if needed)
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Seed the database (only if needed)
echo "🌱 Seeding database..."
npx prisma db seed

echo "✅ Deployment complete!"
echo "🌐 Server is ready to start at port 3001"
