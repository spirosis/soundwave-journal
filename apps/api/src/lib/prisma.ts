import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { isProduction } from "./env.js";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

prisma.refreshSession
  .deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  })
  .catch(() => { /* best-effort — no bloquea el boot */ });
