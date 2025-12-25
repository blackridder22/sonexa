/**
 * Offline Sync Queue
 * Handles queuing sync operations when offline with retry logic and exponential backoff
 */

import { getDb } from './db';

// Sync operation types
export type SyncOperation = 'upload' | 'download' | 'delete';

// Sync queue item status
export type SyncStatus = 'pending' | 'processing' | 'failed' | 'completed';

// Sync queue item interface
export interface SyncQueueItem {
    id: number;
    operation: SyncOperation;
    file_id: string;
    storage_path: string | null;
    file_type: 'music' | 'sfx';
    status: SyncStatus;
    retry_count: number;
    max_retries: number;
    last_error: string | null;
    next_retry_at: string | null;
    created_at: string;
    updated_at: string;
}

// Exponential backoff delays (in ms)
const BACKOFF_DELAYS = [
    1000 * 30,      // 30 seconds
    1000 * 60,      // 1 minute
    1000 * 60 * 5,  // 5 minutes
    1000 * 60 * 15, // 15 minutes
    1000 * 60 * 60, // 1 hour
];

const MAX_RETRIES = 5;

/**
 * Initialize sync queue table
 */
export function initSyncQueue(): void {
    const db = getDb();

    db.exec(`
        CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation TEXT NOT NULL CHECK(operation IN ('upload', 'download', 'delete')),
            file_id TEXT NOT NULL,
            storage_path TEXT,
            file_type TEXT NOT NULL CHECK(file_type IN ('music', 'sfx')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'failed', 'completed')),
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT ${MAX_RETRIES},
            last_error TEXT,
            next_retry_at TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_next_retry ON sync_queue(next_retry_at);
    `);

    console.log('[SyncQueue] Initialized');
}

/**
 * Add an operation to the sync queue
 */
export function queueSyncOperation(
    operation: SyncOperation,
    fileId: string,
    fileType: 'music' | 'sfx',
    storagePath?: string
): SyncQueueItem {
    const db = getDb();

    const stmt = db.prepare(`
        INSERT INTO sync_queue (operation, file_id, storage_path, file_type, status)
        VALUES (?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(operation, fileId, storagePath || null, fileType);

    console.log(`[SyncQueue] Queued ${operation} for file ${fileId}`);

    return getQueueItem(result.lastInsertRowid as number)!;
}

/**
 * Get a sync queue item by ID
 */
export function getQueueItem(id: number): SyncQueueItem | undefined {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM sync_queue WHERE id = ?');
    return stmt.get(id) as SyncQueueItem | undefined;
}

/**
 * Get pending items ready for processing
 */
export function getPendingItems(limit = 10): SyncQueueItem[] {
    const db = getDb();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
        SELECT * FROM sync_queue 
        WHERE status IN ('pending', 'failed')
        AND (next_retry_at IS NULL OR next_retry_at <= ?)
        ORDER BY created_at ASC
        LIMIT ?
    `);

    return stmt.all(now, limit) as SyncQueueItem[];
}

/**
 * Mark item as processing
 */
export function markProcessing(id: number): boolean {
    const db = getDb();
    const stmt = db.prepare(`
        UPDATE sync_queue 
        SET status = 'processing', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `);
    return stmt.run(id).changes > 0;
}

/**
 * Mark item as completed and remove from queue
 */
export function markCompleted(id: number): boolean {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM sync_queue WHERE id = ?');
    return stmt.run(id).changes > 0;
}

/**
 * Mark item as failed with retry scheduling
 */
export function markFailed(id: number, error: string): boolean {
    const db = getDb();

    // Get current retry count
    const item = getQueueItem(id);
    if (!item) return false;

    const newRetryCount = item.retry_count + 1;

    if (newRetryCount >= MAX_RETRIES) {
        // Max retries reached, mark as permanently failed
        const stmt = db.prepare(`
            UPDATE sync_queue 
            SET status = 'failed', 
                retry_count = ?, 
                last_error = ?,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `);
        console.log(`[SyncQueue] Item ${id} permanently failed after ${MAX_RETRIES} retries`);
        return stmt.run(newRetryCount, error, id).changes > 0;
    }

    // Calculate next retry time with exponential backoff
    const backoffIndex = Math.min(newRetryCount - 1, BACKOFF_DELAYS.length - 1);
    const delay = BACKOFF_DELAYS[backoffIndex];
    const nextRetryAt = new Date(Date.now() + delay).toISOString();

    const stmt = db.prepare(`
        UPDATE sync_queue 
        SET status = 'failed', 
            retry_count = ?, 
            last_error = ?,
            next_retry_at = ?,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `);

    console.log(`[SyncQueue] Item ${id} failed, retry ${newRetryCount}/${MAX_RETRIES} scheduled for ${nextRetryAt}`);
    return stmt.run(newRetryCount, error, nextRetryAt, id).changes > 0;
}

/**
 * Get queue statistics
 */
export function getQueueStats(): { pending: number; processing: number; failed: number; total: number } {
    const db = getDb();

    const pending = (db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'").get() as any).count;
    const processing = (db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'processing'").get() as any).count;
    const failed = (db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE status = 'failed' AND retry_count >= max_retries").get() as any).count;
    const total = (db.prepare("SELECT COUNT(*) as count FROM sync_queue").get() as any).count;

    return { pending, processing, failed, total };
}

/**
 * Clear completed items older than specified days
 */
export function clearOldItems(daysOld = 7): number {
    const db = getDb();
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const stmt = db.prepare(`
        DELETE FROM sync_queue 
        WHERE status = 'completed' AND updated_at < ?
    `);

    return stmt.run(cutoff).changes;
}

/**
 * Clear all failed items that have exceeded max retries
 */
export function clearPermanentlyFailed(): number {
    const db = getDb();
    const stmt = db.prepare(`
        DELETE FROM sync_queue 
        WHERE status = 'failed' AND retry_count >= max_retries
    `);
    return stmt.run().changes;
}

/**
 * Reset stuck processing items (e.g., after app crash)
 */
export function resetStuckItems(): number {
    const db = getDb();
    const stmt = db.prepare(`
        UPDATE sync_queue 
        SET status = 'pending', updated_at = CURRENT_TIMESTAMP 
        WHERE status = 'processing'
    `);
    const changes = stmt.run().changes;
    if (changes > 0) {
        console.log(`[SyncQueue] Reset ${changes} stuck items`);
    }
    return changes;
}

/**
 * Check if an operation is already queued for a file
 */
export function isQueued(fileId: string, operation: SyncOperation): boolean {
    const db = getDb();
    const stmt = db.prepare(`
        SELECT COUNT(*) as count FROM sync_queue 
        WHERE file_id = ? AND operation = ? AND status IN ('pending', 'processing')
    `);
    return (stmt.get(fileId, operation) as any).count > 0;
}
