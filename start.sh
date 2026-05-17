#!/bin/bash
# start.sh - Entrypoint script for the unified Docker container

# Start Nginx in the background
echo "Starting Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Start Node.js backend in the foreground
echo "Starting Node.js Backend..."
cd /app/backend

# Apply database schema
echo "Pushing Prisma schema..."
npx prisma db push --accept-data-loss

# Seed admin/hod accounts
echo "Seeding accounts..."
node /app/backend/seed_accounts.js

npm start &
NODE_PID=$!

# Wait for both processes
# If either process crashes, the container should exit
wait -n $NGINX_PID $NODE_PID
exit $?
