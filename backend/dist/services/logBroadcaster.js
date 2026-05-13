"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClient = registerClient;
exports.unregisterClient = unregisterClient;
exports.broadcastLog = broadcastLog;
exports.clearBuffer = clearBuffer;
const MAX_BUFFER = 500;
const clients = new Set();
const buffer = [];
function registerClient(ws) {
    clients.add(ws);
    if (buffer.length > 0) {
        ws.send(JSON.stringify({ kind: "replay", entries: buffer }));
    }
}
function unregisterClient(ws) {
    clients.delete(ws);
}
function broadcastLog(entry) {
    buffer.push(entry);
    if (buffer.length > MAX_BUFFER)
        buffer.shift();
    const msg = JSON.stringify({ kind: "log", entry });
    for (const ws of clients) {
        if (ws.readyState === ws.OPEN)
            ws.send(msg);
    }
}
function clearBuffer() {
    buffer.length = 0;
    const msg = JSON.stringify({ kind: "clear" });
    for (const ws of clients) {
        if (ws.readyState === ws.OPEN)
            ws.send(msg);
    }
}
