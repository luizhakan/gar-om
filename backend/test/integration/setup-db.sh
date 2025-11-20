#!/bin/bash
set -e

echo "Setting up test database..."

# Start test database container
docker compose up -d db-test

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 3

# Load test environment
export DATABASE_URL="postgresql://admin:admin@localhost:5433/garcom_test?schema=public"

# Run migrations
npx prisma migrate deploy

echo "Test database ready!"
