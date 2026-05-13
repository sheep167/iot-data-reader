import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pLimit from "p-limit";
import { isEmpty, trim, map } from "lodash";
import { batchInsert } from "../repositories/sensorReadingRepository";
import { addLog } from "./ingestionState";
import type { IngestionCounters } from "../types/ingestion";
import { parseRow } from "../utils/csv";
import { config } from "../config";
import { BATCH_SIZE } from "../constants/ingestion";
import type { SensorReadingInput } from "../types/repository";

export async function runFiles(
  files: string[],
  signal: AbortSignal,
  counters: IngestionCounters,
  onFileCompleted?: (fileName: string) => void,
): Promise<boolean[]> {
  const limit = pLimit(config.concurrency);
  return Promise.all(
    map(files, (f) =>
      limit(async () => {
        if (signal.aborted) return false;
        const completed = await processFile(f, signal, counters);
        if (completed) onFileCompleted?.(path.basename(f));
        return completed;
      }),
    ),
  );
}

export async function processFile(
  filePath: string,
  signal: AbortSignal,
  counters: IngestionCounters,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const batch: SensorReadingInput[] = [];
    let fileRows = 0;
    let fileInserted = 0;
    let fileSkipped = 0;
    let fileErrors = 0;
    let lineNumber = 1;
    let settled = false;

    const settle = (result: true | false | Error) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      if (result instanceof Error) reject(result);
      else resolve(result);
    };

    const flushBatch = async () => {
      if (isEmpty(batch)) return;
      const toInsert = batch.splice(0, batch.length);
      const inserted = await batchInsert(toInsert);
      const skipped = toInsert.length - inserted;
      fileInserted += inserted;
      fileSkipped += skipped;
      counters.insertedRows += inserted;
      counters.skippedRows += skipped;
      addLog(
        "success",
        `${fileName} — batch of ${toInsert.length}: ${inserted} inserted, ${skipped} duplicate(s) skipped`,
      );
    };

    const handleRow = async (row: Record<string, string>) => {
      lineNumber++;
      fileRows++;
      counters.totalRows++;

      const record = parseRow(row);
      if (!record) {
        fileErrors++;
        counters.errorRows++;
        const s = trim(row["sensorName"]) || "?";
        const t = trim(row["timestamp"]) || "?";
        const v = trim(row["value"]) || "?";
        addLog(
          "error",
          `${fileName}:${lineNumber} — invalid record: sensorName="${s}", timestamp="${t}", value="${v}"`,
        );
        return;
      }

      batch.push(record);

      if (batch.length >= BATCH_SIZE) {
        csvStream.pause();
        try {
          await flushBatch();
        } catch (e) {
          addLog("error", `Batch insert error in ${fileName}: ${e}`);
        }
        if (!signal.aborted) csvStream.resume();
      }
    };

    const handleEnd = async () => {
      try {
        await flushBatch();
        counters.processedFiles++;
        addLog(
          "info",
          `Completed ${fileName}: ${fileRows} rows — ${fileInserted} inserted, ${fileSkipped} duplicate(s), ${fileErrors} invalid`,
        );
        settle(true);
      } catch (e) {
        settle(e instanceof Error ? e : new Error(String(e)));
      }
    };

    const readStream = fs.createReadStream(filePath);
    const csvStream = readStream.pipe(csv());

    const onAbort = () => {
      readStream.destroy();
      csvStream.destroy();
    };
    signal.addEventListener("abort", onAbort, { once: true });

    csvStream.on("data", handleRow);
    csvStream.on("end", handleEnd);
    csvStream.on("error", (err) =>
      signal.aborted ? settle(false) : settle(err),
    );
    csvStream.on("close", () => {
      if (signal.aborted) settle(false);
    });
  });
}
