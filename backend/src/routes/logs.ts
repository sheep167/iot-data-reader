import { FastifyInstance } from "fastify";
import { registerClient, unregisterClient } from "../utils/broadcaster";

export async function logsRoutes(app: FastifyInstance) {
  app.get("/logs/ws", { websocket: true }, (socket) => {
    registerClient(socket);
    socket.on("close", () => unregisterClient(socket));
  });
}
