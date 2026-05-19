#!/bin/sh
# Sidecar entrypoint — push schema then start Next.js
set -e

echo "==> [template-filling] Applying Template/Field schema to Postgres..."
npx prisma db push --accept-data-loss

echo "==> [template-filling] Starting Next.js on port ${PORT:-3100}..."
exec npx next start -p "${PORT:-3100}"
