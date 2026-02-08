import path from "path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";

let dbPromise: Promise<Database> | undefined;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    const dbPath = path.resolve(process.cwd(), "..", "database", "campus_events.db");
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  }

  return dbPromise!;
}
