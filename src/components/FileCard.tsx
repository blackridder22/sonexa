// File record interface
export interface FileRecord {
    id: string;
    filename: string;
    type: 'music' | 'sfx';
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

interface FileCardProps {
    file: FileRecord;
    isSelected?: boolean;
    onSelect?: (file: FileRecord) => void;
    onPlay?: (file: FileRecord) => void;
}

// Format file size
const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Format duration
const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function FileCard({ file, isSelected, onSelect, onPlay }: FileCardProps) {
    const handleDragStart = (e: React.DragEvent) => {
        e.preventDefault();
        // Native drag will be implemented in T7
        if (window.sonexa) {
            window.sonexa.startDrag(file.path, '');
        }
    };

    const handleClick = () => {
        onSelect?.(file);
    };

    const handleDoubleClick = () => {
        onPlay?.(file);
    };

    return (
        <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            draggable
            onDragStart={handleDragStart}
            className={`
        flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
        ${isSelected
                    ? 'bg-sonexa-primary/20 border border-sonexa-primary/30'
                    : 'bg-sonexa-surface/50 hover:bg-sonexa-surface border border-transparent'
                }
      `}
        >
            {/* Icon / Thumbnail */}
            <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200
        group-hover:scale-105
        ${file.type === 'music'
                    ? 'bg-gradient-to-br from-sonexa-primary/30 to-sonexa-primary/10'
                    : 'bg-gradient-to-br from-sonexa-secondary/30 to-sonexa-secondary/10'
                }
      `}>
                {file.type === 'music' ? (
                    <svg className="w-6 h-6 text-sonexa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-sonexa-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
                    </svg>
                )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate text-white group-hover:text-sonexa-primary transition-colors">
                    {file.filename}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{file.duration > 0 ? formatDuration(file.duration) : '--:--'}</span>
                    <span>•</span>
                    <span>{formatSize(file.size)}</span>
                    {file.bpm && (
                        <>
                            <span>•</span>
                            <span>{file.bpm} BPM</span>
                        </>
                    )}
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

            {/* Cloud status */}
            <div className="w-8 flex justify-center">
                {file.cloud_url ? (
                    <div className="relative group/cloud">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs rounded opacity-0 group-hover/cloud:opacity-100 transition-opacity whitespace-nowrap">
                            Synced to cloud
                        </div>
                    </div>
                ) : (
                    <div className="relative group/cloud">
                        <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-xs rounded opacity-0 group-hover/cloud:opacity-100 transition-opacity whitespace-nowrap">
                            Local only
                        </div>
                    </div>
                )}
            </div>

            {/* Play button (visible on hover) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onPlay?.(file);
                }}
                className="w-10 h-10 rounded-full bg-sonexa-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-sonexa-primary/90"
            >
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
            </button>
        </div>
    );
}
