"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
const db_1 = require("../db");
async function healthRoutes(app) {
    app.get("/health", async (_req, reply) => {
        try {
            await (0, db_1.getDb)().$queryRaw `SELECT 1`;
            return reply.send({ status: "ok", db: "connected" });
        }
        catch {
            return reply.status(503).send({ status: "error", db: "disconnected" });
        }
    });
}
