"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const config_1 = require("./config");
const health_1 = require("./routes/health");
const ingest_1 = require("./routes/ingest");
const readings_1 = require("./routes/readings");
const logs_1 = require("./routes/logs");
const ingestionService_1 = require("./services/ingestionService");
const db_1 = require("./db");
const app = (0, fastify_1.default)({ logger: true });
async function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully…`);
    (0, ingestionService_1.stopIngestion)();
    await (0, db_1.getDb)().$disconnect();
    await app.close();
    process.exit(0);
}
async function main() {
    await app.register(cors_1.default, { origin: true });
    await app.register(websocket_1.default);
    await app.register(health_1.healthRoutes);
    await app.register(ingest_1.ingestRoutes);
    await app.register(readings_1.readingsRoutes);
    await app.register(logs_1.logsRoutes);
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    await app.listen({ port: config_1.config.port, host: "0.0.0.0" });
    console.log(`Backend running on port ${config_1.config.port}`);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
