import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'sonexa.db');
const db = new Database(dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      filename TEXT,
      type TEXT,
      path TEXT,
      hash TEXT,
      duration REAL,
      size INTEGER,
      tags TEXT,
      bpm INTEGER,
      created_at DATETIME,
      updated_at DATETIME,
      cloud_url TEXT,
      cloud_id TEXT
    );
  `);
}

export function insertFile(file: any) {
  const stmt = db.prepare(`
    INSERT INTO files (id, filename, type, path, hash, duration, size, tags, bpm, created_at, updated_at)
    VALUES (@id, @filename, @type, @path, @hash, @duration, @size, @tags, @bpm, @created_at, @updated_at)
  `);
  stmt.run(file);
}

export function listFiles() {
  const stmt = db.prepare('SELECT * FROM files');
  return stmt.all();
}
