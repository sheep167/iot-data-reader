-- CreateTable
CREATE TABLE "SensorReading" (
    "id" SERIAL NOT NULL,
    "sensorName" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SensorReading_sensorName_timestamp_key" ON "SensorReading"("sensorName", "timestamp");

-- CreateIndex
CREATE INDEX "SensorReading_sensorName_idx" ON "SensorReading"("sensorName");

-- CreateIndex
CREATE INDEX "SensorReading_timestamp_idx" ON "SensorReading"("timestamp");
