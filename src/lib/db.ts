import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Decodes a local prisma+postgres:// connection string into the actual direct postgres:// URL.
// This is necessary because pg.Pool does not natively understand the prisma+postgres:// proxy protocol.
function getDirectDatabaseUrl(urlStr: string): string {
  if (urlStr && urlStr.startsWith("prisma+postgres://")) {
    try {
      const url = new URL(urlStr);
      const apiKey = url.searchParams.get("api_key");
      if (apiKey) {
        const decoded = Buffer.from(apiKey, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        if (parsed.databaseUrl) {
          return parsed.databaseUrl;
        }
      }
    } catch (e) {
      console.warn("Failed to decode prisma+postgres api_key:", e);
    }
  }
  return urlStr;
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || "";
const directUrl = getDirectDatabaseUrl(connectionString);

let prisma: PrismaClient;
let pool: pg.Pool;

if (process.env.NODE_ENV === "production") {
  pool = new pg.Pool({ connectionString: directUrl, max: 2 });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Prevent multiple connections during hot-reloading in development
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
    pool?: pg.Pool;
  };

  if (!globalWithPrisma.pool) {
    globalWithPrisma.pool = new pg.Pool({ connectionString: directUrl, max: 2 });
  }
  pool = globalWithPrisma.pool;

  if (!globalWithPrisma.prisma) {
    const adapter = new PrismaPg(pool);
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma, pool };
export type * from "@/generated/prisma/client";
