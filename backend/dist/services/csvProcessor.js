"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFiles = runFiles;
exports.processFile = processFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const p_limit_1 = __importDefault(require("p-limit"));
const lodash_1 = require("lodash");
const sensorReadingRepository_1 = require("../repositories/sensorReadingRepository");
const ingestionState_1 = require("./ingestionState");
const csvUtils_1 = require("./csvUtils");
const config_1 = require("../config");
const ingestion_1 = require("../constants/ingestion");
async function runFiles(files, signal, counters, onFileCompleted) {
    const limit = (0, p_limit_1.default)(config_1.config.concurrency);
    return Promise.all(files.map((f) => limit(async () => {
        if (signal.aborted)
            return false;
        const completed = await processFile(f, signal, counters);
        if (completed)
            onFileCompleted?.(path_1.default.basename(f));
        return completed;
    })));
}
async function processFile(filePath, signal, counters) {
    return new Promise((resolve, reject) => {
        const fileName = path_1.default.basename(filePath);
        const batch = [];
        let fileRows = 0;
        let fileInserted = 0;
        let fileSkipped = 0;
        let fileErrors = 0;
        let lineNumber = 1;
        let settled = false;
        const settle = (result) => {
            if (settled)
                return;
            settled = true;
            signal.removeEventListener("abort", onAbort);
            if (result instanceof Error)
                reject(result);
            else
                resolve(result);
        };
        const flushBatch = async () => {
            if ((0, lodash_1.isEmpty)(batch))
                return;
            const toInsert = batch.splice(0, batch.length);
            const inserted = await (0, sensorReadingRepository_1.batchInsert)(toInsert);
            const skipped = toInsert.length - inserted;
            fileInserted += inserted;
            fileSkipped += skipped;
            counters.insertedRows += inserted;
            counters.skippedRows += skipped;
            (0, ingestionState_1.addLog)("success", `${fileName} — batch of ${toInsert.length}: ${inserted} inserted, ${skipped} duplicate(s) skipped`);
        };
        const handleRow = async (row) => {
            lineNumber++;
            fileRows++;
            counters.totalRows++;
            const record = (0, csvUtils_1.parseRow)(row);
            if (!record) {
                fileErrors++;
                counters.errorRows++;
                const s = (row["sensorName"] ?? "").trim() || "?";
                const t = (row["timestamp"] ?? "").trim() || "?";
                const v = (row["value"] ?? "").trim() || "?";
                (0, ingestionState_1.addLog)("error", `${fileName}:${lineNumber} — invalid record: sensorName="${s}", timestamp="${t}", value="${v}"`);
                return;
            }
            batch.push(record);
            if (batch.length >= ingestion_1.BATCH_SIZE) {
                csvStream.pause();
                try {
                    await flushBatch();
                }
                catch (e) {
                    (0, ingestionState_1.addLog)("error", `Batch insert error in ${fileName}: ${e}`);
                }
                if (!signal.aborted)
                    csvStream.resume();
            }
        };
        const handleEnd = async () => {
            try {
                await flushBatch();
                counters.processedFiles++;
                (0, ingestionState_1.addLog)("info", `Completed ${fileName}: ${fileRows} rows — ${fileInserted} inserted, ${fileSkipped} duplicate(s), ${fileErrors} invalid`);
                settle(true);
            }
            catch (e) {
                settle(e instanceof Error ? e : new Error(String(e)));
            }
        };
        const readStream = fs_1.default.createReadStream(filePath);
        const csvStream = readStream.pipe((0, csv_parser_1.default)());
        const onAbort = () => {
            readStream.destroy();
            csvStream.destroy();
        };
        signal.addEventListener("abort", onAbort, { once: true });
        csvStream.on("data", handleRow);
        csvStream.on("end", handleEnd);
        csvStream.on("error", (err) => signal.aborted ? settle(false) : settle(err));
        csvStream.on("close", () => settle(false));
    });
}
