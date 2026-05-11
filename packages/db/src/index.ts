import { PrismaClient } from '@prisma/client';

export const databasePackageStatus = 'schema-ready-milestone-1' as const;

const globalForPrisma = globalThis as unknown as {
  margoPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.margoPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.margoPrisma = prisma;
}

export type { PrismaClient } from '@prisma/client';
