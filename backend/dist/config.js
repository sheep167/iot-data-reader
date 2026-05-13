"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataDir = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT ?? "3001", 10),
    databaseUrl: process.env.DATABASE_URL ?? "",
    dataDir: process.env.DATA_DIR ?? "./data",
    concurrency: parseInt(process.env.CONCURRENCY ?? "5", 10),
};
// Configuration is read from environment variables only — no runtime mutation.
const getDataDir = () => exports.config.dataDir;
exports.getDataDir = getDataDir;
