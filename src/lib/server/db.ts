import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = path.resolve('data', 'sort16.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS best_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    time REAL NOT NULL,
    difficulty INTEGER NOT NULL,
    moves INTEGER NOT NULL,
    seed TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(username, difficulty)
  );
  CREATE INDEX IF NOT EXISTS idx_best_times_difficulty ON best_times(difficulty, time);
  CREATE INDEX IF NOT EXISTS idx_best_times_username ON best_times(username);
  CREATE INDEX IF NOT EXISTS idx_completions_difficulty ON completions(difficulty, count DESC);
`);

export default db;
