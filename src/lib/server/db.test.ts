import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';

function createTestDb(): InstanceType<typeof Database> {
  const db = new Database(':memory:');
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

  return db;
}

describe('users table', () => {
  let db: InstanceType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('should insert and retrieve a user', () => {
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('alice', 'hash123');

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get('alice') as {
      id: number;
      username: string;
      password_hash: string;
    };

    expect(user).toBeDefined();
    expect(user.username).toBe('alice');
    expect(user.password_hash).toBe('hash123');
    expect(user.id).toBe(1);
  });

  it('should enforce unique username constraint', () => {
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('alice', 'hash123');

    expect(() => {
      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('alice', 'hash456');
    }).toThrow();
  });
});

describe('best_times table', () => {
  let db: InstanceType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('should insert and query by difficulty ordered by time', () => {
    const insert = db.prepare(
      'INSERT INTO best_times (username, time, difficulty, moves, seed) VALUES (?, ?, ?, ?, ?)'
    );

    insert.run('alice', 15.5, 4, 20, 'seed1');
    insert.run('bob', 12.3, 4, 18, 'seed2');
    insert.run('carol', 18.1, 4, 25, 'seed3');
    insert.run('dave', 10.0, 8, 30, 'seed4');

    const results = db
      .prepare('SELECT * FROM best_times WHERE difficulty = ? ORDER BY time ASC')
      .all(4) as { username: string; time: number }[];

    expect(results).toHaveLength(3);
    expect(results[0].username).toBe('bob');
    expect(results[0].time).toBe(12.3);
    expect(results[1].username).toBe('alice');
    expect(results[1].time).toBe(15.5);
    expect(results[2].username).toBe('carol');
    expect(results[2].time).toBe(18.1);
  });

  it('should not include results from other difficulties', () => {
    const insert = db.prepare(
      'INSERT INTO best_times (username, time, difficulty, moves, seed) VALUES (?, ?, ?, ?, ?)'
    );

    insert.run('alice', 15.5, 4, 20, 'seed1');
    insert.run('bob', 10.0, 8, 30, 'seed2');

    const results = db
      .prepare('SELECT * FROM best_times WHERE difficulty = ? ORDER BY time ASC')
      .all(8) as { username: string }[];

    expect(results).toHaveLength(1);
    expect(results[0].username).toBe('bob');
  });
});

describe('completions table', () => {
  let db: InstanceType<typeof Database>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('should upsert with ON CONFLICT and increment count', () => {
    const upsert = db.prepare(`
      INSERT INTO completions (username, difficulty, count)
      VALUES (?, ?, 1)
      ON CONFLICT(username, difficulty) DO UPDATE SET count = count + 1
    `);

    upsert.run('alice', 4);
    let row = db
      .prepare('SELECT count FROM completions WHERE username = ? AND difficulty = ?')
      .get('alice', 4) as { count: number };
    expect(row.count).toBe(1);

    upsert.run('alice', 4);
    row = db
      .prepare('SELECT count FROM completions WHERE username = ? AND difficulty = ?')
      .get('alice', 4) as { count: number };
    expect(row.count).toBe(2);

    upsert.run('alice', 4);
    row = db
      .prepare('SELECT count FROM completions WHERE username = ? AND difficulty = ?')
      .get('alice', 4) as { count: number };
    expect(row.count).toBe(3);
  });

  it('should track completions per difficulty independently', () => {
    const upsert = db.prepare(`
      INSERT INTO completions (username, difficulty, count)
      VALUES (?, ?, 1)
      ON CONFLICT(username, difficulty) DO UPDATE SET count = count + 1
    `);

    upsert.run('alice', 4);
    upsert.run('alice', 4);
    upsert.run('alice', 8);

    const diff4 = db
      .prepare('SELECT count FROM completions WHERE username = ? AND difficulty = ?')
      .get('alice', 4) as { count: number };
    const diff8 = db
      .prepare('SELECT count FROM completions WHERE username = ? AND difficulty = ?')
      .get('alice', 8) as { count: number };

    expect(diff4.count).toBe(2);
    expect(diff8.count).toBe(1);
  });
});
