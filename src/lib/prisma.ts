import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const adapter = new PrismaPg(pool);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  globalForPrisma.prisma = db;
}
