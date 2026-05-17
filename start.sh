#!/bin/sh
# start.sh — entrypoint for the unified Docker container (Nginx + Node.js)
set -e

cd /app/backend

echo "==> Applying database schema..."
npx prisma db push --accept-data-loss

echo "==> Seeding initial accounts (skipped if already seeded)..."
node scripts/seed-accounts.js || echo "    Seed step skipped or already applied."

echo "==> Starting Nginx..."
nginx

echo "==> Starting Node.js API server..."
exec node server.js
