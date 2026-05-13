"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsRoutes = logsRoutes;
const logBroadcaster_1 = require("../services/logBroadcaster");
async function logsRoutes(app) {
    app.get("/logs/ws", { websocket: true }, (socket) => {
        (0, logBroadcaster_1.registerClient)(socket);
        socket.on("close", () => (0, logBroadcaster_1.unregisterClient)(socket));
    });
}
