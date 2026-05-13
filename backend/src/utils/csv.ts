import fs from "fs";
import path from "path";
import { trim, isNaN as _isNaN } from "lodash";
import type { SensorReadingInput } from "../types/repository";

export function getCsvFiles(dataDir: string): string[] {
  return fs
    .readdirSync(dataDir)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .map((f) => path.join(dataDir, f));
}

export function parseRow(
  row: Record<string, string>,
): SensorReadingInput | null {
  const sensorName = trim(row["sensorName"]);
  const timestampRaw = trim(row["timestamp"]);
  const valueRaw = trim(row["value"]);

  if (!sensorName) return null;

  const ts = new Date(timestampRaw);
  if (_isNaN(ts.getTime())) return null;

  const value = parseFloat(valueRaw);
  if (_isNaN(value)) return null;

  return { sensorName, timestamp: ts, value };
}
