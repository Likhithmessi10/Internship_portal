const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;
const shouldLogQueries = process.env.PRISMA_LOG_QUERIES === 'true';

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: shouldLogQueries ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
