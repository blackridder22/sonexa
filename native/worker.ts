/**
 * Worker thread for CPU-intensive file operations
 * Handles SHA-1 hashing and audio metadata extraction off the main thread
 */

import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface WorkerTask {
    type: 'hash' | 'metadata' | 'full';
    filePath: string;
    taskId: string;
}

interface HashResult {
    taskId: string;
    type: 'hash';
    hash: string;
}

interface MetadataResult {
    taskId: string;
    type: 'metadata';
    duration: number;
    size: number;
}

interface FullResult {
    taskId: string;
    type: 'full';
    hash: string;
    duration: number;
    size: number;
}

type WorkerResult = HashResult | MetadataResult | FullResult;

/**
 * Calculate SHA-1 hash of a file
 */
function calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha1');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}

/**
 * Get audio duration using ffprobe or afinfo (macOS fallback)
 */
async function getAudioDuration(filePath: string): Promise<number> {
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
        // ffprobe not available, try afinfo (macOS)
        try {
            const { stdout } = await execAsync(`afinfo "${filePath}" | grep duration`);
            const match = stdout.match(/duration:\s*([\d.]+)/);
            if (match) {
                return parseFloat(match[1]);
            }
        } catch {
            // Neither available
            console.warn('[Worker] Could not determine duration for:', filePath);
        }
    }
    return 0;
}

/**
 * Process incoming tasks
 */
async function processTask(task: WorkerTask): Promise<WorkerResult> {
    const { type, filePath, taskId } = task;

    switch (type) {
        case 'hash': {
            const hash = await calculateFileHash(filePath);
            return { taskId, type: 'hash', hash };
        }
        case 'metadata': {
            const [duration, size] = await Promise.all([
                getAudioDuration(filePath),
                Promise.resolve(getFileSize(filePath)),
            ]);
            return { taskId, type: 'metadata', duration, size };
        }
        case 'full': {
            const [hash, duration] = await Promise.all([
                calculateFileHash(filePath),
                getAudioDuration(filePath),
            ]);
            return {
                taskId,
                type: 'full',
                hash,
                duration,
                size: getFileSize(filePath),
            };
        }
        default:
            throw new Error(`Unknown task type: ${type}`);
    }
}

// Listen for messages from main thread
if (parentPort) {
    parentPort.on('message', async (task: WorkerTask) => {
        try {
            const result = await processTask(task);
            parentPort!.postMessage({ success: true, ...result });
        } catch (error) {
            parentPort!.postMessage({
                success: false,
                taskId: task.taskId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });

    // Signal ready
    parentPort.postMessage({ type: 'ready' });
}

export type { WorkerTask, WorkerResult, HashResult, MetadataResult, FullResult };
