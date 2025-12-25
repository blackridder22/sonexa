import { useState } from 'react';
import { showToast, hideToast } from './Toast';

interface CloudFile {
    name: string;
    id: string;
    storagePath: string;
    type: 'music' | 'sfx';
    size: number;
    updated_at: string;
}

interface CloudFileCardProps {
    file: CloudFile;
    viewMode?: 'list' | 'grid';
    isSelected?: boolean;
    onSelect?: (storagePath: string, multi?: boolean) => void;
    onDownloadComplete?: () => void;
}

// Format file size
const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Extract original filename from storage name
const getDisplayName = (storageName: string): string => {
    return storageName;
};

export default function CloudFileCard({
    file,
    viewMode = 'list',
    isSelected = false,
    onSelect,
    onDownloadComplete
}: CloudFileCardProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.sonexa || isDownloading) return;

        setIsDownloading(true);
        const toastId = showToast('sync', `Downloading ${getDisplayName(file.name)}...`);

        try {
            await window.sonexa.downloadCloudFile(file.storagePath, file.type);
            hideToast(toastId);
            showToast('success', `Downloaded ${getDisplayName(file.name)}`);
            onDownloadComplete?.();
        } catch (error) {
            hideToast(toastId);
            showToast('error', `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        const isMulti = e.metaKey || e.ctrlKey || e.shiftKey;
        onSelect?.(file.storagePath, isMulti);
    };

    const displayName = getDisplayName(file.name);

    // Grid view
    if (viewMode === 'grid') {
        return (
            <div
                onClick={handleClick}
                className={`
                    relative p-4 rounded-xl transition-all duration-200 cursor-pointer group
                    border border-dashed
                    ${isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 ring-2 ring-cyan-500/50'
                        : 'bg-sonexa-surface/30 border-cyan-500/30 hover:border-cyan-500/50'
                    }
                `}
            >
                {/* Selection indicator */}
                {isSelected && (
                    <div className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}

                {/* Cloud badge */}
                <div className="absolute top-2 right-2 z-10">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                        Cloud
                    </span>
                </div>

                {/* Icon */}
                <div className={`
                    w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 relative
                    ${file.type === 'music'
                        ? 'bg-gradient-to-br from-sonexa-primary/20 to-sonexa-primary/5'
                        : 'bg-gradient-to-br from-sonexa-secondary/20 to-sonexa-secondary/5'
                    }
                `}>
                    <img
                        src={file.type === 'music' ? '/icons/music.png' : '/icons/sfx.png'}
                        alt={file.type}
                        className="w-10 h-10 object-contain opacity-75"
                    />
                    {/* Cloud overlay */}
                    <img
                        src="./icons/cloud.png"
                        alt="Cloud"
                        className="absolute bottom-0 right-0 w-5 h-5"
                    />

                    {/* Download button on hover */}
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {isDownloading ? (
                            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </div>
                        )}
                    </button>
                </div>

                {/* Info */}
                <h3 className="font-medium text-sm text-center truncate text-gray-300">{displayName}</h3>
                <p className="text-xs text-center text-gray-500 mt-1">
                    {formatSize(file.size)} • {file.type}
                </p>
            </div>
        );
    }

    // List view
    return (
        <div
            onClick={handleClick}
            className={`
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
                border border-dashed
                ${isSelected
                    ? 'bg-cyan-500/20 border-cyan-500 ring-2 ring-cyan-500/50'
                    : 'bg-sonexa-surface/30 border-cyan-500/30 hover:border-cyan-500/50'
                }
            `}
        >
            {/* Selection checkbox */}
            <div className={`
                w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}
            `}>
                {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>

            {/* Icon */}
            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center relative
                ${file.type === 'music'
                    ? 'bg-gradient-to-br from-sonexa-primary/20 to-sonexa-primary/5'
                    : 'bg-gradient-to-br from-sonexa-secondary/20 to-sonexa-secondary/5'
                }
            `}>
                <img
                    src={file.type === 'music' ? '/icons/music.png' : '/icons/sfx.png'}
                    alt={file.type}
                    className="w-7 h-7 object-contain opacity-75"
                />
                {/* Cloud overlay */}
                <img
                    src="./icons/cloud.png"
                    alt="Cloud"
                    className="absolute -bottom-1 -right-1 w-4 h-4"
                />
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate text-gray-300 group-hover:text-cyan-400 transition-colors">
                    {displayName}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{formatSize(file.size)}</span>
                    <span>•</span>
                    <span className="text-cyan-500/70">Cloud only</span>
                </div>
            </div>

            {/* Type badge */}
            <span className={`
                text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wide
                ${file.type === 'music'
                    ? 'bg-sonexa-primary/20 text-sonexa-primary'
                    : 'bg-sonexa-secondary/20 text-sonexa-secondary'
                }
            `}>
                {file.type}
            </span>

            {/* Download button */}
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-cyan-500/30"
            >
                {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export type { CloudFile };
