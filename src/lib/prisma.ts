import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  if (url.includes("user:password@localhost")) return false;
  return true;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("user:password@localhost")) {
    return new PrismaClient();
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
