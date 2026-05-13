import dotenv from "dotenv";
import { toInteger, defaultTo } from "lodash";
dotenv.config();

export const config = {
  port: toInteger(defaultTo(process.env.PORT, "3001")),
  databaseUrl: defaultTo(process.env.DATABASE_URL, ""),
  dataDir: defaultTo(process.env.DATA_DIR, "./data"),
  concurrency: toInteger(defaultTo(process.env.CONCURRENCY, "5")),
};

export const getDataDir = () => config.dataDir;
