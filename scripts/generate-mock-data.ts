import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

function parseArgs(): {
  outDir: string;
  numFiles: number;
  targetMB: number;
  parallelism: number;
} {
  const args = process.argv.slice(2);
  const defaults = {
    outDir: "../data",
    numFiles: 5,
    targetMB: 10,
    parallelism: 4,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--out-dir":
        defaults.outDir = args[++i];
        break;
      case "--num-files":
        defaults.numFiles = parseInt(args[++i], 10);
        break;
      case "--target-mb":
        defaults.targetMB = parseInt(args[++i], 10);
        break;
      case "--parallelism":
        defaults.parallelism = parseInt(args[++i], 10);
        break;
    }
  }

  return defaults;
}

const SCRIPT_DIR = path.dirname(__filename);
const { outDir, numFiles, targetMB, parallelism } = parseArgs();
const OUT_DIR = path.resolve(SCRIPT_DIR, outDir);
const NUM_FILES = numFiles;
const TARGET_BYTES = targetMB * 1024 * 1024;
const MAX_PARALLEL = parallelism;

const SENSOR_TYPES = [
  { prefix: "temperature", min: -20, max: 85 },
  { prefix: "pressure", min: 900, max: 1100 },
  { prefix: "humidity", min: 0, max: 100 },
  { prefix: "voltage", min: 0, max: 240 },
  { prefix: "current", min: 0, max: 30 },
  { prefix: "vibration", min: 0, max: 10 },
  { prefix: "light", min: 0, max: 10000 },
  { prefix: "co2", min: 300, max: 5000 },
  { prefix: "flow", min: 0, max: 100 },
  { prefix: "rpm", min: 0, max: 6000 },
];

const SENSORS: Array<{ name: string; min: number; max: number }> =
  SENSOR_TYPES.flatMap(({ prefix, min, max }) =>
    Array.from({ length: 10 }, (_, i) => ({
      name: `${prefix}_sensor_${String(i + 1).padStart(3, "0")}`,
      min,
      max,
    })),
  );

const SHARED_DUPLICATES: string[] = Array.from({ length: 20 }, (_, i) => {
  const s = SENSORS[i % SENSORS.length];
  const ts = new Date(Date.now() - i * 60_000).toISOString();
  const val = (s.min + Math.random() * (s.max - s.min)).toFixed(4);
  return `${s.name},${ts},${val}`;
});

function makeRow(
  rowIndex: number,
  fileIndex: number,
  baseTime: number,
): string {
  const s = SENSORS[Math.floor(Math.random() * SENSORS.length)];
  const ts = new Date(
    baseTime + (fileIndex * 10_000_000 + rowIndex) * 1000,
  ).toISOString();
  const val = (s.min + Math.random() * (s.max - s.min)).toFixed(4);

  if (rowIndex % 1000 === 1) return `${s.name},NOT_A_TIMESTAMP,${val}`;
  if (rowIndex % 1001 === 2) return `${s.name},${ts},not_a_number`;
  return `${s.name},${ts},${val}`;
}

async function generateFile(fileIndex: number): Promise<void> {
  const filePath = path.join(OUT_DIR, `file-${fileIndex}.csv`);
  let writtenBytes = 0;
  let rowIndex = 0;
  let headerDone = false;

  const CHUNK_ROWS = 50_000;

  const source = new Readable({
    read() {
      if (!headerDone) {
        const header = "sensorName,timestamp,value\n";
        writtenBytes += Buffer.byteLength(header);
        this.push(header);
        headerDone = true;
        return;
      }

      if (writtenBytes >= TARGET_BYTES) {
        const tail = SHARED_DUPLICATES.join("\n") + "\n";
        this.push(tail);
        this.push(null);
        return;
      }

      const parts: string[] = [];
      for (let i = 0; i < CHUNK_ROWS && writtenBytes < TARGET_BYTES; i++) {
        const row = makeRow(rowIndex, fileIndex, BASE_TIME) + "\n";
        parts.push(row);
        writtenBytes += Buffer.byteLength(row);
        rowIndex++;
      }
      this.push(parts.join(""));
    },
  });

  await pipeline(source, fs.createWriteStream(filePath));
  console.log(
    `[${fileIndex}/${NUM_FILES}] Created ${path.basename(filePath)} ` +
      `(~${(writtenBytes / 1024 / 1024).toFixed(1)} MB, ${rowIndex.toLocaleString()} rows)`,
  );
}

const BASE_TIME = Date.now() - 2 * 365 * 24 * 3600 * 1000;

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(
    `Generating ${NUM_FILES} file(s) × ~${targetMB} MB each` +
      ` (${MAX_PARALLEL} in parallel) → ${OUT_DIR}`,
  );

  for (let start = 0; start < NUM_FILES; start += MAX_PARALLEL) {
    const end = Math.min(start + MAX_PARALLEL, NUM_FILES);
    await Promise.all(
      Array.from({ length: end - start }, (_, i) =>
        generateFile(start + i + 1),
      ),
    );
  }

  console.log("Mock data generation complete.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
