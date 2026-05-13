"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCounters = getCounters;
exports.getStatus = getStatus;
exports.getCompletedFiles = getCompletedFiles;
exports.markFileCompleted = markFileCompleted;
exports.isIngestionRunning = isIngestionRunning;
exports.isStopped = isStopped;
exports.startRun = startRun;
exports.finishRun = finishRun;
exports.addLog = addLog;
const logBroadcaster_1 = require("./logBroadcaster");
let state = "idle";
let counters = makeEmptyCounters();
let startedAt;
let completedAt;
let completedFiles = [];
function makeEmptyCounters() {
    return {
        totalFiles: 0,
        processedFiles: 0,
        totalRows: 0,
        insertedRows: 0,
        skippedRows: 0,
        errorRows: 0,
    };
}
function getCounters() {
    return counters;
}
function getStatus() {
    return {
        state,
        counters,
        startedAt,
        completedAt,
        resumable: state === "stopped",
    };
}
function getCompletedFiles() {
    return completedFiles;
}
function markFileCompleted(fileName) {
    completedFiles.push(fileName);
}
function isIngestionRunning() {
    return state === "running";
}
function isStopped() {
    return state === "stopped";
}
function startRun(resume) {
    state = "running";
    if (!resume) {
        counters = makeEmptyCounters();
        completedFiles = [];
    }
    startedAt = new Date().toISOString();
    completedAt = undefined;
    return counters;
}
function finishRun(result, err) {
    state = result;
    completedAt = new Date().toISOString();
    if (result === "done") {
        addLog("success", "All files processed — ingestion complete");
        completedFiles = [];
    }
    else if (result === "stopped") {
        addLog("info", `Ingestion stopped — ${completedFiles.length} file(s) completed, can be resumed`);
    }
    else {
        addLog("error", `Ingestion failed: ${err}`);
    }
}
function addLog(type, message) {
    const entry = { type, message, ts: new Date().toISOString() };
    console.log(`[${entry.ts}] [${type.toUpperCase()}] ${message}`);
    (0, logBroadcaster_1.broadcastLog)(entry);
}
