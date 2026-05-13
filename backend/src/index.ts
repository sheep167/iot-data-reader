import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { config } from "./config";
import { healthRoutes } from "./routes/health";
import { ingestRoutes } from "./routes/ingest";
import { readingsRoutes } from "./routes/readings";
import { logsRoutes } from "./routes/logs";
import { stopIngestion } from "./services/ingestionService";
import { getDb } from "./db";

const app = Fastify({ logger: true });

async function shutdown() {
  stopIngestion();
  await getDb().$disconnect();
  await app.close();
  process.exit(0);
}

async function main() {
  await app.register(cors, { origin: true });
  await app.register(websocket);
  await app.register(healthRoutes);
  await app.register(ingestRoutes);
  await app.register(readingsRoutes);
  await app.register(logsRoutes);

  process.on("SIGINT", () => shutdown());
  process.on("SIGTERM", () => shutdown());

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
