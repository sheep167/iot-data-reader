"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchInsert = batchInsert;
exports.getPaginatedReadings = getPaginatedReadings;
exports.getDistinctSensorNames = getDistinctSensorNames;
exports.getStats = getStats;
const db_1 = require("../db");
async function batchInsert(records) {
    const result = await (0, db_1.getDb)().sensorReading.createMany({
        data: records,
        skipDuplicates: true,
    });
    return result.count;
}
async function getPaginatedReadings(query) {
    const { page, pageSize, sensorName, search, sortBy = "timestamp", sortOrder = "desc", } = query;
    const where = {};
    if (sensorName) {
        where.sensorName = sensorName;
    }
    else if (search) {
        where.sensorName = { contains: search, mode: "insensitive" };
    }
    const [data, total] = await Promise.all([
        (0, db_1.getDb)().sensorReading.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { [sortBy]: sortOrder },
        }),
        (0, db_1.getDb)().sensorReading.count({ where }),
    ]);
    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
async function getDistinctSensorNames() {
    const results = await (0, db_1.getDb)().sensorReading.findMany({
        select: { sensorName: true },
        distinct: ["sensorName"],
        orderBy: { sensorName: "asc" },
    });
    return results.map((r) => r.sensorName);
}
async function getStats() {
    const total = await (0, db_1.getDb)().sensorReading.count();
    const sensors = await (0, db_1.getDb)().sensorReading.groupBy({
        by: ["sensorName"],
        _count: { sensorName: true },
        _min: { timestamp: true },
        _max: { timestamp: true },
    });
    return { total, sensors };
}
