import { makeAutoObservable } from "mobx";
import { filter, round } from "lodash";
import type { LogEntry, IngestionStatus } from "@/types/api";
import type { LogTab, SortField, SortOrder } from "@/types/store";

export type { LogTab, SortField, SortOrder };

export class IngestionStore {
  state: string = "idle";
  totalFiles = 0;
  processedFiles = 0;
  totalRows = 0;
  insertedRows = 0;
  skippedRows = 0;
  errorRows = 0;
  logs: LogEntry[] = [];
  startedAt?: string;
  finishedAt?: string;

  logTab: LogTab = "all";

  page = 1;
  sensorSearch = "";
  sensorFilter = "";
  sortBy: SortField = "timestamp";
  sortOrder: SortOrder = "desc";

  constructor() {
    makeAutoObservable(this);
  }

  updateFromStatus(status: IngestionStatus | null) {
    if (!status) {
      this.state = "idle";
      this.totalFiles = 0;
      this.processedFiles = 0;
      this.totalRows = 0;
      this.insertedRows = 0;
      this.skippedRows = 0;
      this.errorRows = 0;
      this.startedAt = undefined;
      this.finishedAt = undefined;
      return;
    }
    this.state = status.state;
    this.totalFiles = status.counters.totalFiles;
    this.processedFiles = status.counters.processedFiles;
    this.totalRows = status.counters.totalRows;
    this.insertedRows = status.counters.insertedRows;
    this.skippedRows = status.counters.skippedRows;
    this.errorRows = status.counters.errorRows;
    this.startedAt = status.startedAt;
    this.finishedAt = status.completedAt;
  }

  appendLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
  }

  setLogs(entries: LogEntry[]) {
    this.logs = entries;
  }

  clearLogs() {
    this.logs = [];
  }

  setLogTab(tab: LogTab) {
    this.logTab = tab;
  }

  setPage(p: number) {
    this.page = p;
  }

  setSensorSearch(val: string) {
    this.sensorSearch = val;
    this.sensorFilter = "";
    this.page = 1;
  }

  setSensorFilter(val: string) {
    this.sensorFilter = val;
    this.sensorSearch = "";
    this.page = 1;
  }

  clearFilters() {
    this.sensorSearch = "";
    this.sensorFilter = "";
    this.page = 1;
  }

  toggleSort(field: SortField) {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
    } else {
      this.sortBy = field;
      this.sortOrder = "asc";
    }
    this.page = 1;
  }

  get filteredLogs(): LogEntry[] {
    if (this.logTab === "all") return this.logs;
    return filter(this.logs, (l) => l.type === this.logTab);
  }

  get progressPct() {
    if (this.totalFiles === 0) return 0;
    return round((this.processedFiles / this.totalFiles) * 100);
  }

  get isRunning() {
    return this.state === "running";
  }

  get resumable() {
    return this.state === "stopped";
  }

  get isDone() {
    return this.state === "done";
  }
}

export const ingestionStore = new IngestionStore();
