# IoT Data Reader

## Quick Configuration

**Configure Target Directory and Database (as per requirements):**

The application is designed to be easily configurable:

- **Target Directory** (`DATA_DIR` env var): Specifies the directory containing CSV files to process. Default: `./data`
  - In Docker: Edit the volume mount in `docker-compose.yml` and set `DATA_DIR` under backend environment.

- **Target Database** (`DATABASE_URL` env var): PostgreSQL connection string.
  - In Docker: Update in `docker-compose.yml`. Supports external DBs by removing postgres service if needed.

See the [Configuration](#configuration) section for full details and examples.

## How to Run the Program

### Prerequisites

- Docker and Docker Compose

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/sheep167/iot-data-reader.git
   cd iot-data-reader
   ```

2. (Optional) Generate Mock/Test Data:
   ```bash
   cd scripts
   npm install
   npm run generate # Generates realistic CSV files with some invalid/duplicate data
   cd ..
   ```

3. Start the full stack:
   ```bash
   docker compose up --build
   ```

4. Access the application:
   - Dashboard: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

## Demo Flow

1. Open the dashboard and click Start Ingestion to watch parallel processing in action.
2. Monitor real-time progress, logs via WebSocket.
3. Use Stop for graceful shutdown.
4. Query and filter stored readings in the interactive table.

## Simple Architecture

The system uses a Docker Compose orchestrated stack:

- **Frontend:** React application for UI and real-time interaction.
- **Backend:** Node.js service handling file discovery, parallel ingestion, validation, and DB operations.
- **Database:** PostgreSQL with Prisma ORM.
- **Data Volume:** CSV files mounted into the backend container.

**Data Flow:**

1. CSV files placed in configured directory.
2. Ingestion triggered via API (from dashboard or directly).
3. Backend discovers .csv files and processes them concurrently (configurable concurrency).
4. Each file is streamed and parsed row-by-row.
5. Rows are validated (ISO8601 timestamp, numeric value), invalid ones logged/skipped.
6. Valid records batched and inserted with deduplication.
7. Real-time updates pushed to frontend via WebSockets and polling.

## Database Schema

```prisma
model SensorReading {
  id          Int      @id @default(autoincrement())
  sensorName  String
  timestamp   DateTime @db.Timestamptz
  value       Decimal  @db.Decimal(18, 6)

  @@unique([sensorName, timestamp]) // Deduplication key
  @@index([sensorName])
  @@index([timestamp])
}
```

- **Constraints:** Unique composite key ensures no duplicate readings per sensor at the same timestamp.
- **Indexes:** Optimized for queries by sensor and time range.
- **Data Types:** Timestamptz for timezone-aware timestamps; high-precision Decimal for sensor values.

## Tech Stacks

### Backend

- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Fastify (high performance, low overhead)
- **ORM:** Prisma (type-safe queries, migrations, schema-first)
- **Database:** PostgreSQL 16
- **Parsing:** csv-parser (streaming for large files)
- **Concurrency:** p-limit for controlled parallel file processing
- **Real-time:** WebSockets for live logs

**Key Design Choices:**

- Streaming parsing to handle >1GB files without high memory usage.
- Batch inserts with skipDuplicates for efficiency.
- Graceful shutdown and resumable ingestion.

### Frontend

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui + Radix primitives
- **State:** MobX for reactive stores
- **Data Fetching:** TanStack Query (caching, polling, background updates)
- **Real-time:** WebSocket integration
