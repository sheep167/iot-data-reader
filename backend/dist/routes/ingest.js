"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestRoutes = ingestRoutes;
const ingestionService_1 = require("../services/ingestionService");
const ingestionState_1 = require("../services/ingestionState");
const config_1 = require("../config");
async function ingestRoutes(app) {
    app.post("/ingest", async (_req, reply) => {
        const dataDir = (0, config_1.getDataDir)();
        (0, ingestionService_1.startIngestion)(dataDir).catch((err) => console.error("Ingestion error:", err));
        return reply.status(202).send({ message: "Ingestion started" });
    });
    app.post("/stop", async (_req, reply) => {
        (0, ingestionService_1.stopIngestion)();
        return reply.send({ message: "Stop signal sent" });
    });
    app.get("/status", async (_req, reply) => {
        return reply.send((0, ingestionState_1.getStatus)());
    });
}
