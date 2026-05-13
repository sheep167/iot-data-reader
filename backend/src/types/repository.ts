export interface SensorReadingInput {
  sensorName: string;
  timestamp: Date;
  value: number;
}

export interface ReadingsQuery {
  page: number;
  pageSize: number;
  sensorName?: string;
  search?: string;
  sortBy?: "sensorName" | "timestamp";
  sortOrder?: "asc" | "desc";
}
