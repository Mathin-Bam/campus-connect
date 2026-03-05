// Mock database for now - will replace with real Prisma later
export const prisma = {
  user: {
    findUnique: async () => null,
    create: async () => null,
    update: async () => null,
  },
  university: {
    findUnique: async () => null,
    findMany: async () => [],
  },
  $queryRaw: async () => null,
} as any;
