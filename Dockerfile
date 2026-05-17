# ── Stage 1: Build Frontend ────────────────────────────────────────────────
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
# Build with relative API URL so Nginx can proxy it natively
ENV VITE_API_URL=/api/v1
RUN npm run build

# ── Stage 2: Build Admin Portal ──────────────────────────────────────────────
FROM node:20-bookworm-slim AS admin-builder
WORKDIR /app/admin-portal
COPY admin-portal/package*.json ./
RUN npm ci
COPY admin-portal ./
ENV VITE_API_URL=/api/v1
ENV VITE_API_BASE_URL=""
ENV VITE_MONETARY_ENABLED=false
RUN npm run build

# ── Stage 3: Runtime Environment ─────────────────────────────────────────────
FROM node:20-bookworm-slim

# Install Nginx, Chromium (for Puppeteer), and build tools for native modules (like bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the backend source
COPY backend ./

# Ensure uploads directory exists
RUN mkdir -p /app/backend/uploads

# Setup Nginx web directories
RUN rm -rf /var/www/html/*
RUN mkdir -p /var/www/html/admin

# Copy static builds from previous stages
COPY --from=frontend-builder /app/frontend/dist /var/www/html
COPY --from=admin-builder /app/admin-portal/dist /var/www/html/admin

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default

# Copy start script — strip Windows CRLF line endings, then make executable
COPY start.sh /start.sh
RUN sed -i 's/\r$//' /start.sh && chmod +x /start.sh

EXPOSE 80

ENTRYPOINT ["/start.sh"]
