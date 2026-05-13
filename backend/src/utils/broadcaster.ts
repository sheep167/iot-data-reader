import { forEach } from "lodash";
import type { WebSocket } from "ws";
import type { LogEntry } from "../types/ingestion";

const MAX_BUFFER = 500;

const clients = new Set<WebSocket>();
const buffer: LogEntry[] = [];

export function registerClient(ws: WebSocket): void {
  clients.add(ws);
  if (buffer.length > 0) {
    ws.send(JSON.stringify({ kind: "replay", entries: buffer }));
  }
}

export function unregisterClient(ws: WebSocket): void {
  clients.delete(ws);
}

export function broadcastLog(entry: LogEntry): void {
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  const msg = JSON.stringify({ kind: "log", entry });
  forEach([...clients], (ws) => {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  });
}

export function clearBuffer(): void {
  buffer.length = 0;
  const msg = JSON.stringify({ kind: "clear" });
  forEach([...clients], (ws) => {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  });
}
