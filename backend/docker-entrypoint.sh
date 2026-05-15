#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
# Retry prisma migrate deploy until the DB accepts connections
MAX_RETRIES=15
COUNT=0
until npx prisma migrate deploy 2>&1 | tee /tmp/migrate.log; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Database never became ready after $MAX_RETRIES attempts. Exiting."
    cat /tmp/migrate.log
    exit 1
  fi
  echo "   Retrying in 3s... (attempt $COUNT/$MAX_RETRIES)"
  sleep 3
done

echo "✅ Database schema is up to date."
echo "🚀 Starting APTRANSCO backend server..."
exec node server.js
