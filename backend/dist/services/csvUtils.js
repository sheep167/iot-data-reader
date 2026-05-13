"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCsvFiles = getCsvFiles;
exports.parseRow = parseRow;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getCsvFiles(dataDir) {
    return fs_1.default
        .readdirSync(dataDir)
        .filter((f) => f.toLowerCase().endsWith(".csv"))
        .map((f) => path_1.default.join(dataDir, f));
}
function parseRow(row) {
    const sensorName = (row["sensorName"] ?? "").trim();
    const timestampRaw = (row["timestamp"] ?? "").trim();
    const valueRaw = (row["value"] ?? "").trim();
    if (!sensorName)
        return null;
    const ts = new Date(timestampRaw);
    if (isNaN(ts.getTime()))
        return null;
    const value = parseFloat(valueRaw);
    if (isNaN(value))
        return null;
    return { sensorName, timestamp: ts, value };
}
