"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readingsRoutes = readingsRoutes;
const sensorReadingRepository_1 = require("../repositories/sensorReadingRepository");
async function readingsRoutes(app) {
    app.get("/readings", async (req, reply) => {
        const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize ?? "20", 10)));
        const sensorName = req.query.sensorName || undefined;
        const search = req.query.search || undefined;
        const sortBy = (["sensorName", "timestamp"].includes(req.query.sortBy ?? "")
            ? req.query.sortBy
            : "timestamp");
        const sortOrder = (["asc", "desc"].includes(req.query.sortOrder ?? "")
            ? req.query.sortOrder
            : "desc");
        const result = await (0, sensorReadingRepository_1.getPaginatedReadings)({
            page,
            pageSize,
            sensorName,
            search,
            sortBy,
            sortOrder,
        });
        return reply.send(result);
    });
    app.get("/readings/sensors", async (_req, reply) => {
        const sensors = await (0, sensorReadingRepository_1.getDistinctSensorNames)();
        return reply.send(sensors);
    });
    app.get("/readings/stats", async (_req, reply) => {
        const stats = await (0, sensorReadingRepository_1.getStats)();
        return reply.send(stats);
    });
}
