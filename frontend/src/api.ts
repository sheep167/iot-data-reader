import type { LogEntry, IngestionStatus } from "./types/api";

export type { LogEntry, IngestionStatus };

const BASE = "/api";

export async function getHealth() {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}

export async function triggerIngest() {
  const res = await fetch(`${BASE}/ingest`, { method: "POST" });
  return res.json();
}

export async function stopIngest() {
  const res = await fetch(`${BASE}/stop`, { method: "POST" });
  return res.json();
}

export async function getStatus(): Promise<IngestionStatus> {
  const res = await fetch(`${BASE}/status`);
  return res.json();
}

export async function getReadings(
  page = 1,
  pageSize = 20,
  sensorName?: string,
  search?: string,
  sortBy: "sensorName" | "timestamp" = "timestamp",
  sortOrder: "asc" | "desc" = "desc",
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortOrder,
  });
  if (sensorName) params.set("sensorName", sensorName);
  if (search) params.set("search", search);
  const res = await fetch(`${BASE}/readings?${params}`);
  return res.json();
}

export async function getSensorNames(): Promise<string[]> {
  const res = await fetch(`${BASE}/readings/sensors`);
  return res.json();
}
