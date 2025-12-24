import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

// Database file location
const dbPath = path.join(app.getPath('userData'), 'sonexa.db');
let db: Database.Database | null = null;

// File type enum
export type FileType = 'music' | 'sfx';

// File record interface
export interface FileRecord {
    id: string;
    filename: string;
    type: FileType;
    path: string;
    hash: string;
    duration: number;
    size: number;
    tags: string;
    bpm: number | null;
    created_at: string;
    updated_at: string;
    cloud_url: string | null;
    cloud_id: string | null;
}

// Initialize database
export function initDatabase(): void {
    if (db) return;

    db = new Database(dbPath);

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');

    // Create files table
    db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('music', 'sfx')),
      path TEXT NOT NULL,
      hash TEXT NOT NULL,
      duration REAL DEFAULT 0,
      size INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      bpm INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      cloud_url TEXT,
      cloud_id TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
    CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);
    CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);
  `);

    console.log('Database initialized at:', dbPath);
}

// Get database instance
export function getDb(): Database.Database {
    if (!db) {
        initDatabase();
    }
    return db!;
}

// Insert a new file record
export function insertFile(file: Omit<FileRecord, 'id' | 'created_at' | 'updated_at'>): FileRecord {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
    INSERT INTO files (id, filename, type, path, hash, duration, size, tags, bpm, created_at, updated_at, cloud_url, cloud_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    stmt.run(
        id,
        file.filename,
        file.type,
        file.path,
        file.hash,
        file.duration,
        file.size,
        file.tags,
        file.bpm,
        now,
        now,
        file.cloud_url,
        file.cloud_id
    );

    return {
        ...file,
        id,
        created_at: now,
        updated_at: now,
    };
}

// Get all files
export function getAllFiles(): FileRecord[] {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM files ORDER BY created_at DESC');
    return stmt.all() as FileRecord[];
}

// Get files by type
export function getFilesByType(type: FileType): FileRecord[] {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM files WHERE type = ? ORDER BY created_at DESC');
    return stmt.all(type) as FileRecord[];
}

// Get file by ID
export function getFileById(id: string): FileRecord | undefined {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
    return stmt.get(id) as FileRecord | undefined;
}

// Get file by hash (for deduplication)
export function getFileByHash(hash: string): FileRecord | undefined {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM files WHERE hash = ?');
    return stmt.get(hash) as FileRecord | undefined;
}

// Update file record
export function updateFile(id: string, updates: Partial<FileRecord>): boolean {
    const db = getDb();
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as Record<string, unknown>)[f]);

    const stmt = db.prepare(`UPDATE files SET ${setClause}, updated_at = ? WHERE id = ?`);
    const result = stmt.run(...values, new Date().toISOString(), id);

    return result.changes > 0;
}

// Delete file record
export function deleteFile(id: string): boolean {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM files WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

// Delete all files (for cache clear)
export function deleteAllFiles(): number {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM files');
    const result = stmt.run();
    return result.changes;
}

// Close database connection
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

// Export database path for debugging
export { dbPath };
