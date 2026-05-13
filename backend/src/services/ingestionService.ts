import path from "path";
import { isEmpty, filter } from "lodash";
import {
  isIngestionRunning,
  isStopped,
  startRun,
  addLog,
  finishRun,
  getCompletedFiles,
  markFileCompleted,
} from "./ingestionState";
import { clearBuffer } from "../utils/broadcaster";
import { getCsvFiles } from "../utils/csv";
import { runFiles } from "./csvProcessor";
import { config } from "../config";

let stopController: AbortController | null = null;

export function stopIngestion(): void {
  if (!isIngestionRunning()) return;
  stopController?.abort();
  addLog("info", "Stop signal sent — will halt after current batch…");
}

export async function startIngestion(dataDir: string): Promise<void> {
  if (isIngestionRunning()) throw new Error("Ingestion already in progress");

  const resume = isStopped();

  clearBuffer();
  stopController = new AbortController();
  const counters = startRun(resume);

  if (resume) {
    addLog(
      "info",
      `Resuming ingestion — ${getCompletedFiles().length} file(s) already complete, skipping them`,
    );
  } else {
    addLog("info", `Starting ingestion from directory: ${dataDir}`);
  }

  try {
    const csvFiles = getCsvFiles(dataDir);

    if (isEmpty(csvFiles)) {
      addLog("info", "No CSV files found in directory");
      finishRun("done");
      return;
    }

    const completedSet = new Set(getCompletedFiles());
    const pendingFiles = filter(
      csvFiles,
      (f) => !completedSet.has(path.basename(f)),
    );

    counters.totalFiles = csvFiles.length;

    if (isEmpty(pendingFiles)) {
      addLog("info", "All files already processed");
      finishRun("done");
      return;
    }

    addLog(
      "info",
      `Found ${csvFiles.length} CSV file(s) — ${pendingFiles.length} pending, processing up to ${config.concurrency} in parallel`,
    );

    const results = await runFiles(
      pendingFiles,
      stopController.signal,
      counters,
      markFileCompleted,
    );

    const wasStopped = results.some((r) => r === false);
    finishRun(wasStopped ? "stopped" : "done");
  } catch (err) {
    finishRun("error", err);
    throw err;
  }
}
