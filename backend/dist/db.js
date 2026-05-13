"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const client_1 = require("@prisma/client");
const client = new client_1.PrismaClient();
function getDb() {
    return client;
}
