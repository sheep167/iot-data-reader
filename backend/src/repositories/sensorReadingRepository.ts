import { ceil, map } from "lodash";
import { Prisma } from "@prisma/client";
import { getDb } from "../db";
import type { SensorReadingInput, ReadingsQuery } from "../types/repository";

export type { SensorReadingInput, ReadingsQuery };

export async function batchInsert(
  records: SensorReadingInput[],
): Promise<number> {
  const result = await getDb().sensorReading.createMany({
    data: records,
    skipDuplicates: true,
  });
  return result.count;
}

export async function getPaginatedReadings(query: ReadingsQuery) {
  const {
    page,
    pageSize,
    sensorName,
    search,
    sortBy = "timestamp",
    sortOrder = "desc",
  } = query;

  const where: Prisma.SensorReadingWhereInput = {};
  if (sensorName) {
    where.sensorName = sensorName;
  } else if (search) {
    where.sensorName = { contains: search, mode: "insensitive" };
  }

  const [data, total] = await Promise.all([
    getDb().sensorReading.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    getDb().sensorReading.count({ where }),
  ]);
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: ceil(total / pageSize),
  };
}

export async function getDistinctSensorNames(): Promise<string[]> {
  const results = await getDb().sensorReading.findMany({
    select: { sensorName: true },
    distinct: ["sensorName"],
    orderBy: { sensorName: "asc" },
  });
  return map(results, "sensorName");
}

export async function getStats() {
  const total = await getDb().sensorReading.count();
  const sensors = await getDb().sensorReading.groupBy({
    by: ["sensorName"],
    _count: { sensorName: true },
    _min: { timestamp: true },
    _max: { timestamp: true },
  });
  return { total, sensors };
}
