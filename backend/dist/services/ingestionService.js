"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopIngestion = stopIngestion;
exports.startIngestion = startIngestion;
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
const ingestionState_1 = require("./ingestionState");
const logBroadcaster_1 = require("./logBroadcaster");
const csvUtils_1 = require("./csvUtils");
const csvProcessor_1 = require("./csvProcessor");
const config_1 = require("../config");
let stopController = null;
function stopIngestion() {
    if (!(0, ingestionState_1.isIngestionRunning)())
        return;
    stopController?.abort();
    (0, ingestionState_1.addLog)("info", "Stop signal sent — will halt after current batch…");
}
async function startIngestion(dataDir) {
    if ((0, ingestionState_1.isIngestionRunning)())
        throw new Error("Ingestion already in progress");
    const resume = (0, ingestionState_1.isStopped)();
    (0, logBroadcaster_1.clearBuffer)();
    stopController = new AbortController();
    const counters = (0, ingestionState_1.startRun)(resume);
    if (resume) {
        (0, ingestionState_1.addLog)("info", `Resuming ingestion — ${(0, ingestionState_1.getCompletedFiles)().length} file(s) already complete, skipping them`);
    }
    else {
        (0, ingestionState_1.addLog)("info", `Starting ingestion from directory: ${dataDir}`);
    }
    try {
        const csvFiles = (0, csvUtils_1.getCsvFiles)(dataDir);
        if ((0, lodash_1.isEmpty)(csvFiles)) {
            (0, ingestionState_1.addLog)("info", "No CSV files found in directory");
            (0, ingestionState_1.finishRun)("done");
            return;
        }
        const completedSet = new Set((0, ingestionState_1.getCompletedFiles)());
        const pendingFiles = csvFiles.filter((f) => !completedSet.has(path_1.default.basename(f)));
        counters.totalFiles = csvFiles.length;
        if ((0, lodash_1.isEmpty)(pendingFiles)) {
            (0, ingestionState_1.addLog)("info", "All files already processed");
            (0, ingestionState_1.finishRun)("done");
            return;
        }
        (0, ingestionState_1.addLog)("info", `Found ${csvFiles.length} CSV file(s) — ${pendingFiles.length} pending, processing up to ${config_1.config.concurrency} in parallel`);
        const results = await (0, csvProcessor_1.runFiles)(pendingFiles, stopController.signal, counters, ingestionState_1.markFileCompleted);
        const wasStopped = results.some((r) => r === false);
        (0, ingestionState_1.finishRun)(wasStopped ? "stopped" : "done");
    }
    catch (err) {
        (0, ingestionState_1.finishRun)("error", err);
        throw err;
    }
}
