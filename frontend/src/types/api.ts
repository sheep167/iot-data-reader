export interface LogEntry {
  type: "info" | "success" | "error";
  message: string;
  ts: string;
}

export interface IngestionStatus {
  state: "idle" | "running" | "stopped" | "done" | "error";
  counters: {
    totalFiles: number;
    processedFiles: number;
    totalRows: number;
    insertedRows: number;
    skippedRows: number;
    errorRows: number;
  };
  startedAt?: string;
  completedAt?: string;
}

export interface SensorReading {
  id: number;
  sensorName: string;
  timestamp: string;
  value: number;
}
