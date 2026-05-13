import { FastifyInstance } from "fastify";
import { getDb } from "../db";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_req, reply) => {
    try {
      await getDb().$queryRaw`SELECT 1`;
      return reply.send({ status: "ok", db: "connected" });
    } catch {
      return reply.status(503).send({ status: "error", db: "disconnected" });
    }
  });
}
