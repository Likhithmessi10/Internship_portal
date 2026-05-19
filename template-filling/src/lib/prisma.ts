import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// The PrismaPg adapter uses the native `pg` driver, which ignores the
// `?schema=` URL parameter (that was a Prisma 6 built-in-driver feature).
// We honor it here by extracting it from DATABASE_URL and pushing it into
// the per-connection `search_path`. Required for the APTRANSCO portal,
// where this sidecar shares one database with the main app and lives in
// its own `template_filling` schema.
function buildPool(): Pool {
  const raw = process.env.DATABASE_URL || '';
  let schema = 'public';
  let connectionString = raw;
  try {
    const u = new URL(raw);
    const s = u.searchParams.get('schema');
    if (s) {
      schema = s;
      u.searchParams.delete('schema');
      connectionString = u.toString();
    }
  } catch {
    // malformed URL — let pg surface the real error at connect time
  }
  return new Pool({
    connectionString,
    options: `-c search_path=${schema}`,
  });
}

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const pool = buildPool();
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }
    return client;
  })();

