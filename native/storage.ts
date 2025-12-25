import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { exec } from 'child_process';
import { Worker } from 'worker_threads';
import { getSetting } from '../electron/settings';

const execAsync = promisify(exec);

// Worker thread pool for off-main-thread processing
let worker: Worker | null = null;
let workerReady = false;
const pendingTasks = new Map<string, { resolve: (value: any) => void; reject: (err: Error) => void }>();
let taskIdCounter = 0;

/**
 * Initialize the worker thread
 */
export function initWorker(): void {
    if (worker) return;

    try {
        // Worker path - compiled JS will be in dist-electron/native/worker.js
        const workerPath = path.join(__dirname, 'worker.js');

        if (!fs.existsSync(workerPath)) {
            console.warn('[Storage] Worker file not found, using main thread for processing');
            return;
        }

        worker = new Worker(workerPath);

        worker.on('message', (msg) => {
            if (msg.type === 'ready') {
                workerReady = true;
                console.log('[Storage] Worker thread ready');
                return;
            }

            const { taskId, success, error, ...result } = msg;
            const pending = pendingTasks.get(taskId);

            if (pending) {
                pendingTasks.delete(taskId);
                if (success) {
                    pending.resolve(result);
                } else {
                    pending.reject(new Error(error || 'Worker task failed'));
                }
            }
        });

        worker.on('error', (err) => {
            console.error('[Storage] Worker error:', err);
            // Reject all pending tasks
            for (const [taskId, pending] of pendingTasks) {
                pending.reject(err);
                pendingTasks.delete(taskId);
            }
        });

        worker.on('exit', (code) => {
            console.log('[Storage] Worker exited with code:', code);
            worker = null;
            workerReady = false;
        });
    } catch (err) {
        console.warn('[Storage] Failed to initialize worker:', err);
    }
}

/**
 * Process file using worker thread (with fallback to main thread)
 */
async function processWithWorker<T>(type: 'hash' | 'metadata' | 'full', filePath: string): Promise<T> {
    // Fall back to main thread if worker not available
    if (!worker || !workerReady) {
        if (type === 'hash') {
            return calculateFileHash(filePath) as Promise<T>;
        } else if (type === 'metadata') {
            const [duration, size] = await Promise.all([
                getAudioDuration(filePath),
                Promise.resolve(getFileSize(filePath)),
            ]);
            return { duration, size } as T;
        } else {
            // full
            const [hash, duration] = await Promise.all([
                calculateFileHash(filePath),
                getAudioDuration(filePath),
            ]);
            return { hash, duration, size: getFileSize(filePath) } as T;
        }
    }

    const taskId = `task-${++taskIdCounter}`;

    return new Promise<T>((resolve, reject) => {
        pendingTasks.set(taskId, { resolve, reject });
        worker!.postMessage({ type, filePath, taskId });

        // Timeout after 60 seconds
        setTimeout(() => {
            if (pendingTasks.has(taskId)) {
                pendingTasks.delete(taskId);
                reject(new Error('Worker task timeout'));
            }
        }, 60000);
    });
}

/**
 * Get audio metadata using worker thread (recommended for large imports)
 */
export async function getAudioMetadataAsync(filePath: string): Promise<AudioMetadata> {
    return processWithWorker<AudioMetadata>('full', filePath);
}


// Supported audio extensions
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.aiff', '.aif', '.flac', '.ogg', '.m4a', '.wma'];

// Audio type detection based on filename patterns
const SFX_PATTERNS = [
    /sfx/i,
    /sound.?effect/i,
    /foley/i,
    /whoosh/i,
    /impact/i,
    /hit/i,
    /swoosh/i,
    /click/i,
    /beep/i,
    /transition/i,
];

export interface AudioMetadata {
    duration: number;
    size: number;
    hash: string;
}

// Ensure library directory exists
export function ensureLibraryPath(): string {
    let libraryPath = getSetting('localLibraryPath');

    // Expand ~ to home directory
    if (libraryPath.startsWith('~')) {
        libraryPath = path.join(process.env.HOME || '', libraryPath.slice(1));
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(libraryPath)) {
        fs.mkdirSync(libraryPath, { recursive: true });
    }

    // Create subdirectories
    const musicDir = path.join(libraryPath, 'music');
    const sfxDir = path.join(libraryPath, 'sfx');

    if (!fs.existsSync(musicDir)) {
        fs.mkdirSync(musicDir, { recursive: true });
    }
    if (!fs.existsSync(sfxDir)) {
        fs.mkdirSync(sfxDir, { recursive: true });
    }

    return libraryPath;
}

// Check if file is a supported audio file
export function isAudioFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return AUDIO_EXTENSIONS.includes(ext);
}

// Detect if file is likely SFX or Music based on filename
export function detectFileType(filename: string): 'music' | 'sfx' {
    for (const pattern of SFX_PATTERNS) {
        if (pattern.test(filename)) {
            return 'sfx';
        }
    }
    return 'music';
}

// Calculate SHA-1 hash of file
export function calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha1');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

// Get file size in bytes
export function getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}

// Get audio duration using ffprobe (if available) or return 0
export async function getAudioDuration(filePath: string): Promise<number> {
    try {
        // Try ffprobe first
        const { stdout } = await execAsync(
            `ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
        );
        const duration = parseFloat(stdout.trim());
        if (!isNaN(duration)) {
            return duration;
        }
    } catch {
        // ffprobe not available or failed, try afinfo (macOS)
        try {
            const { stdout } = await execAsync(`afinfo "${filePath}" | grep duration`);
            const match = stdout.match(/duration:\s*([\d.]+)/);
            if (match) {
                return parseFloat(match[1]);
            }
        } catch {
            // Neither available, return 0
            console.warn('Could not determine duration for:', filePath);
        }
    }
    return 0;
}

// Get complete audio metadata
export async function getAudioMetadata(filePath: string): Promise<AudioMetadata> {
    const [hash, duration] = await Promise.all([
        calculateFileHash(filePath),
        getAudioDuration(filePath),
    ]);

    return {
        hash,
        duration,
        size: getFileSize(filePath),
    };
}

// Copy file to library
export async function copyFileToLibrary(
    sourcePath: string,
    type: 'music' | 'sfx'
): Promise<{ destPath: string; filename: string }> {
    const libraryPath = ensureLibraryPath();
    const filename = path.basename(sourcePath);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFilename = `${baseName}_${timestamp}${ext}`;

    const destDir = path.join(libraryPath, type);
    const destPath = path.join(destDir, uniqueFilename);

    // Copy file
    await fs.promises.copyFile(sourcePath, destPath);

    return {
        destPath,
        filename: uniqueFilename,
    };
}

// Remove file from library
export async function removeFileFromLibrary(filePath: string): Promise<boolean> {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to remove file:', error);
        return false;
    }
}

// Clear entire library
export async function clearLibrary(): Promise<number> {
    const libraryPath = ensureLibraryPath();
    let count = 0;

    for (const type of ['music', 'sfx']) {
        const dir = path.join(libraryPath, type);
        if (fs.existsSync(dir)) {
            const files = await fs.promises.readdir(dir);
            for (const file of files) {
                await fs.promises.unlink(path.join(dir, file));
                count++;
            }
        }
    }

    return count;
}

// Get library statistics
export function getLibraryStats(): { musicCount: number; sfxCount: number; totalSize: number } {
    const libraryPath = ensureLibraryPath();
    let musicCount = 0;
    let sfxCount = 0;
    let totalSize = 0;

    for (const type of ['music', 'sfx']) {
        const dir = path.join(libraryPath, type);
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
                if (type === 'music') musicCount++;
                else sfxCount++;
            }
        }
    }

    return { musicCount, sfxCount, totalSize };
}
