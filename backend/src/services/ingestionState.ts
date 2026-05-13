import { broadcastLog } from "../utils/broadcaster";
import type {
  LogType,
  LogEntry,
  IngestionCounters,
  IngestionStatus,
} from "../types/ingestion";

let state: IngestionStatus["state"] = "idle";
let counters: IngestionCounters = makeEmptyCounters();
let startedAt: string | undefined;
let completedAt: string | undefined;
let completedFiles: string[] = [];

function makeEmptyCounters(): IngestionCounters {
  return {
    totalFiles: 0,
    processedFiles: 0,
    totalRows: 0,
    insertedRows: 0,
    skippedRows: 0,
    errorRows: 0,
  };
}

export function getCounters(): IngestionCounters {
  return counters;
}

export function getStatus(): IngestionStatus {
  return {
    state,
    counters,
    startedAt,
    completedAt,
    resumable: state === "stopped",
  };
}

export function getCompletedFiles(): string[] {
  return completedFiles;
}

export function markFileCompleted(fileName: string): void {
  completedFiles.push(fileName);
}

export function isIngestionRunning(): boolean {
  return state === "running";
}

export function isStopped(): boolean {
  return state === "stopped";
}

export function startRun(resume: boolean): IngestionCounters {
  state = "running";
  if (!resume) {
    counters = makeEmptyCounters();
    completedFiles = [];
  }
  startedAt = new Date().toISOString();
  completedAt = undefined;
  return counters;
}

export function finishRun(
  result: "done" | "stopped" | "error",
  err?: unknown,
): void {
  state = result;
  completedAt = new Date().toISOString();
  if (result === "done") {
    addLog("success", "All files processed — ingestion complete");
    completedFiles = [];
  } else if (result === "stopped") {
    addLog(
      "info",
      `Ingestion stopped — ${completedFiles.length} file(s) completed, can be resumed`,
    );
  } else {
    addLog("error", `Ingestion failed: ${err}`);
  }
}

export function addLog(type: LogType, message: string): void {
  const entry: LogEntry = { type, message, ts: new Date().toISOString() };
  if (type === "error") {
    console.error(`[${type.toUpperCase()}] ${message}`);
  }
  broadcastLog(entry);
}
