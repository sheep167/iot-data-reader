import { FastifyInstance } from "fastify";
import { startIngestion, stopIngestion } from "../services/ingestionService";
import { getStatus } from "../services/ingestionState";
import { getDataDir } from "../config";

export async function ingestRoutes(app: FastifyInstance) {
  app.post("/ingest", async (_req, reply) => {
    const dataDir = getDataDir();
    startIngestion(dataDir).catch((err) =>
      app.log.error(err, "Ingestion error"),
    );
    return reply.status(202).send({ message: "Ingestion started" });
  });

  app.post("/stop", async (_req, reply) => {
    stopIngestion();
    return reply.send({ message: "Stop signal sent" });
  });

  app.get("/status", async (_req, reply) => {
    return reply.send(getStatus());
  });
}
