import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export function getDb(): PrismaClient {
  return client;
}
