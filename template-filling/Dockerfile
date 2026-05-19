# ── Stage 1: Build Next.js app ───────────────────────────────────────────────
FROM node:24-bookworm-slim AS builder
WORKDIR /app

# Build tools needed for any native module compilation (better-sqlite3, pg, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/*

# Install deps (cached layer)
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# Generate Prisma client against the bundled schema. Prisma 7's prisma.config.ts
# eagerly resolves DATABASE_URL — supply a placeholder; the real one comes in at
# runtime via docker-compose's environment block.
RUN DATABASE_URL="postgresql://placeholder@placeholder:5432/placeholder?schema=template_filling" \
    npx prisma generate

# Copy the rest of the source and build
COPY . .
# Same placeholder for `next build` — Next 16 may also evaluate prisma.config.ts.
RUN DATABASE_URL="postgresql://placeholder@placeholder:5432/placeholder?schema=template_filling" \
    npm run build


# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3100

# Runtime libs only (no compilers needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Bring over installed deps, build output, public assets and prisma schema
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Uploaded templates land here; backed by a docker volume in compose
RUN mkdir -p /app/uploads

# Entrypoint: sync schema then launch
COPY docker-start.sh /docker-start.sh
RUN sed -i 's/\r$//' /docker-start.sh && chmod +x /docker-start.sh

EXPOSE 3100
ENTRYPOINT ["/docker-start.sh"]
