import { clamp, toInteger, includes } from "lodash";
import { FastifyInstance } from "fastify";
import {
  getPaginatedReadings,
  getDistinctSensorNames,
  getStats,
} from "../repositories/sensorReadingRepository";

export async function readingsRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: {
      page?: string;
      pageSize?: string;
      sensorName?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    };
  }>("/readings", async (req, reply) => {
    const page = Math.max(1, toInteger(req.query.page) || 1);
    const pageSize = clamp(toInteger(req.query.pageSize) || 20, 1, 100);
    const sensorName = req.query.sensorName || undefined;
    const search = req.query.search || undefined;
    const sortBy = (
      includes(["sensorName", "timestamp"], req.query.sortBy)
        ? req.query.sortBy
        : "timestamp"
    ) as "sensorName" | "timestamp";
    const sortOrder = (
      includes(["asc", "desc"], req.query.sortOrder)
        ? req.query.sortOrder
        : "desc"
    ) as "asc" | "desc";

    const result = await getPaginatedReadings({
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
    const sensors = await getDistinctSensorNames();
    return reply.send(sensors);
  });

  app.get("/readings/stats", async (_req, reply) => {
    const stats = await getStats();
    return reply.send(stats);
  });
}
