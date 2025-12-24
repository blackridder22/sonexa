import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getSettings } from '../electron/settings';
import { getSecret } from '../electron/secrets';

let supabaseClient: SupabaseClient | null = null;
let bucketEnsured = false;

const BUCKET_NAME = 'sonexa-files';
const SUPABASE_KEY_NAME = 'supabase-key';

/**
 * Initialize or get Supabase client
 */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
    const settings = getSettings();
    const supabaseUrl = settings.supabaseUrl;
    const supabaseKey = await getSecret(SUPABASE_KEY_NAME);

    if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase not configured: missing URL or key');
        return null;
    }

    // Create new client if URL changed or not initialized
    if (!supabaseClient) {
        supabaseClient = createClient(supabaseUrl, supabaseKey);
        bucketEnsured = false; // Reset bucket check when client changes
    }

    return supabaseClient;
}

/**
 * Reset Supabase client (call when credentials change)
 */
export function resetSupabaseClient(): void {
    supabaseClient = null;
    bucketEnsured = false;
}

/**
 * Ensure the storage bucket exists, create if not
 */
async function ensureBucketExists(client: SupabaseClient): Promise<void> {
    if (bucketEnsured) return;

    // Check if bucket exists
    const { data: buckets, error: listError } = await client.storage.listBuckets();

    if (listError) {
        console.error('Failed to list buckets:', listError);
        // Don't throw - might just be permissions, try to upload anyway
        return;
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
        console.log(`Bucket "${BUCKET_NAME}" not found, creating...`);

        const { error: createError } = await client.storage.createBucket(BUCKET_NAME, {
            public: true, // Make files publicly accessible
        });

        if (createError) {
            // If it's a "already exists" error, that's fine
            if (!createError.message?.includes('already exists')) {
                console.error('Failed to create bucket:', createError);
                throw new Error(`Failed to create storage bucket: ${createError.message}`);
            }
        } else {
            console.log(`Bucket "${BUCKET_NAME}" created successfully`);
        }
    }

    bucketEnsured = true;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
    localFilePath: string,
    fileType: 'music' | 'sfx',
    fileId: string
): Promise<{ path: string; url: string } | null> {
    const client = await getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not configured. Please add URL and key in Settings (⌘,)');
    }

    // Ensure bucket exists (auto-create if needed)
    await ensureBucketExists(client);

    // Check file exists
    if (!fs.existsSync(localFilePath)) {
        throw new Error(`File not found: ${localFilePath}`);
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(localFilePath);
    const fileName = path.basename(localFilePath);

    // Keep original filename - Supabase handles encoding automatically
    // We just need to use the file path correctly
    const storagePath = `${fileType}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
            cacheControl: '3600',
            upsert: true, // Overwrite if exists
            contentType: getContentType(localFilePath),
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = client.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

    return {
        path: data.path,
        url: urlData.publicUrl,
    };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteCloudFile(storagePath: string): Promise<boolean> {
    const client = await getSupabaseClient();
    if (!client) return false;

    const { error } = await client.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

    if (error) {
        console.error('Supabase delete error:', error);
        return false;
    }

    return true;
}

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const types: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.aiff': 'audio/aiff',
        '.aif': 'audio/aiff',
        '.flac': 'audio/flac',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.wma': 'audio/x-ms-wma',
    };
    return types[ext] || 'application/octet-stream';
}

/**
 * Check if Supabase is configured
 */
export async function isSupabaseConfigured(): Promise<boolean> {
    const settings = getSettings();
    const supabaseKey = await getSecret(SUPABASE_KEY_NAME);
    return !!(settings.supabaseUrl && supabaseKey);
}

/**
 * Cloud file metadata
 */
export interface CloudFile {
    name: string;
    id: string;
    storagePath: string;
    type: 'music' | 'sfx';
    size: number;
    updated_at: string;
}

/**
 * List all files from cloud storage
 */
export async function listCloudFiles(type?: 'music' | 'sfx'): Promise<CloudFile[]> {
    const client = await getSupabaseClient();
    if (!client) return [];

    const folders = type ? [type] : ['music', 'sfx'];
    const allFiles: CloudFile[] = [];

    for (const folder of folders) {
        let offset = 0;
        const limit = 500;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await client.storage
                .from(BUCKET_NAME)
                .list(folder, {
                    limit,
                    offset,
                    sortBy: { column: 'name', order: 'asc' }
                });

            if (error) {
                console.error(`Failed to list ${folder}:`, error);
                break;
            }

            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            // Filter out .keep placeholder files
            const files = data.filter(f => f.name !== '.keep' && f.id);

            for (const file of files) {
                allFiles.push({
                    name: file.name,
                    id: file.id!,
                    storagePath: `${folder}/${file.name}`,
                    type: folder as 'music' | 'sfx',
                    size: file.metadata?.size || 0,
                    updated_at: file.updated_at || new Date().toISOString(),
                });
            }

            offset += limit;
            hasMore = data.length === limit;
        }
    }

    return allFiles;
}

/**
 * Download a file from cloud storage to local library
 */
export async function downloadFile(
    storagePath: string,
    fileType: 'music' | 'sfx'
): Promise<{ localPath: string; filename: string } | null> {
    const client = await getSupabaseClient();
    if (!client) {
        throw new Error('Supabase not configured');
    }

    // Download file blob
    const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .download(storagePath);

    if (error || !data) {
        console.error('Download failed:', error);
        throw new Error(`Download failed: ${error?.message || 'No data'}`);
    }

    // Get the original filename from the storage path
    // Path format: type/filename.ext (original name preserved)
    const pathParts = storagePath.split('/');
    const originalFilename = pathParts[pathParts.length - 1];

    // Import storage module to get library path
    const { ensureLibraryPath } = await import('./storage');
    const libraryPath = ensureLibraryPath();

    // Create destination path
    const destDir = path.join(libraryPath, fileType);
    const destPath = path.join(destDir, originalFilename);

    // Ensure directory exists
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Write file to disk
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(destPath, buffer);

    return {
        localPath: destPath,
        filename: originalFilename,
    };
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(storagePath: string): string | null {
    if (!supabaseClient) return null;

    const { data } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

    return data.publicUrl;
}
