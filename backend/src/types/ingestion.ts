export type LogType = "info" | "success" | "error";

export interface LogEntry {
  type: LogType;
  message: string;
  ts: string;
}

export interface IngestionCounters {
  totalFiles: number;
  processedFiles: number;
  totalRows: number;
  insertedRows: number;
  skippedRows: number;
  errorRows: number;
}

export interface IngestionStatus {
  state: "idle" | "running" | "stopped" | "done" | "error";
  counters: IngestionCounters;
  startedAt?: string;
  completedAt?: string;
  resumable: boolean;
}
