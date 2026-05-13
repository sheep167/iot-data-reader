import { useEffect } from "react";
import { ingestionStore } from "@/store/ingestionStore";
import type { LogEntry } from "@/types/api";

type WsMessage =
  | { kind: "log"; entry: LogEntry }
  | { kind: "replay"; entries: LogEntry[] }
  | { kind: "clear" };

export function useLogStream(): void {
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/logs/ws`,
    );

    ws.onmessage = (event: MessageEvent) => {
      const msg: WsMessage = JSON.parse(event.data as string);
      if (msg.kind === "log") {
        ingestionStore.appendLog(msg.entry);
      } else if (msg.kind === "replay") {
        ingestionStore.setLogs(msg.entries);
      } else if (msg.kind === "clear") {
        ingestionStore.clearLogs();
      }
    };

    return () => ws.close();
  }, []);
}
