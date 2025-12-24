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
    favorite: number;
    created_at: string;
    updated_at: string;
    cloud_url: string | null;
    cloud_id: string | null;
}

interface FileCardProps {
    file: FileRecord;
    isSelected?: boolean;
    onSelect?: (file: FileRecord, multi?: boolean) => void;
    onPlay?: (file: FileRecord) => void;
    onToggleFavorite?: (file: FileRecord) => void;
    onUpload?: (file: FileRecord) => void;
    viewMode?: 'list' | 'grid';
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

export default function FileCard({ file, isSelected, onSelect, onPlay, onToggleFavorite, onUpload, viewMode = 'list' }: FileCardProps) {
    const handleDragStart = (e: React.DragEvent) => {
        e.preventDefault();
        if (window.sonexa) {
            window.sonexa.startDrag(file.path);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        onSelect?.(file, e.metaKey || e.ctrlKey || e.shiftKey);
    };

    const handleDoubleClick = () => {
        onPlay?.(file);
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite?.(file);
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPlay?.(file);
    };

    const handleUpload = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpload?.(file);
    };

    const isSynced = !!file.cloud_url;

    // Grid view layout
    if (viewMode === 'grid') {
        return (
            <div
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                draggable
                onDragStart={handleDragStart}
                className={`
                    relative p-4 rounded-xl transition-all duration-200 cursor-pointer group
                    ${isSelected
                        ? 'bg-sonexa-primary/20 ring-2 ring-sonexa-primary'
                        : 'bg-sonexa-surface/50 hover:bg-sonexa-surface'
                    }
                `}
            >
                {/* Selection checkbox */}
                <div
                    className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(file, true);
                    }}
                >
                    <div className={`
                        w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                        ${isSelected
                            ? 'bg-sonexa-primary border-sonexa-primary'
                            : 'border-gray-500 hover:border-sonexa-primary'
                        }
                    `}>
                        {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </div>

                {/* Favorite star - always visible in corner */}
                <button
                    onClick={handleToggleFavorite}
                    className={`absolute top-2 right-2 z-10 p-1 rounded-full transition-all ${file.favorite === 1
                        ? 'text-yellow-500'
                        : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-yellow-500'
                        }`}
                >
                    <svg className="w-4 h-4" fill={file.favorite === 1 ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </button>

                {/* Icon */}
                <div className={`
                    w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 relative
                    ${file.type === 'music'
                        ? 'bg-gradient-to-br from-sonexa-primary/30 to-sonexa-primary/10'
                        : 'bg-gradient-to-br from-sonexa-secondary/30 to-sonexa-secondary/10'
                    }
                `}>
                    <img
                        src={file.type === 'music' ? '/icons/music.png' : '/icons/sfx.png'}
                        alt={file.type}
                        className="w-10 h-10 object-contain"
                    />

                    {/* Small play button on icon */}
                    <button
                        onClick={handlePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <div className="w-8 h-8 rounded-full bg-sonexa-primary flex items-center justify-center">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </button>
                </div>

                {/* Info */}
                <h3 className="font-medium text-sm text-center truncate text-white">{file.filename}</h3>
                <p className="text-xs text-center text-gray-500 mt-1">
                    {file.duration > 0 ? formatDuration(file.duration) : '--:--'} • {formatSize(file.size)}
                </p>
            </div>
        );
    }

    // List view layout (default)
    return (
        <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            draggable
            onDragStart={handleDragStart}
            className={`
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
                ${isSelected
                    ? 'bg-sonexa-primary/20 ring-1 ring-sonexa-primary/50'
                    : 'bg-sonexa-surface/50 hover:bg-sonexa-surface'
                }
            `}
        >
            {/* Selection checkbox */}
            <div
                className={`transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(file, true);
                }}
            >
                <div className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                    ${isSelected
                        ? 'bg-sonexa-primary border-sonexa-primary'
                        : 'border-gray-500 hover:border-sonexa-primary'
                    }
                `}>
                    {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Icon / Thumbnail */}
            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200
                group-hover:scale-105
                ${file.type === 'music'
                    ? 'bg-gradient-to-br from-sonexa-primary/30 to-sonexa-primary/10'
                    : 'bg-gradient-to-br from-sonexa-secondary/30 to-sonexa-secondary/10'
                }
            `}>
                <img
                    src={file.type === 'music' ? '/icons/music.png' : '/icons/sfx.png'}
                    alt={file.type}
                    className="w-7 h-7 object-contain"
                />
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

            {/* Favorite button */}
            <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg transition-all ${file.favorite === 1
                    ? 'text-yellow-500'
                    : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-yellow-500'
                    }`}
            >
                <svg className="w-5 h-5" fill={file.favorite === 1 ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            </button>

            {/* Cloud sync button */}
            <button
                onClick={handleUpload}
                disabled={isSynced}
                className={`p-2 rounded-lg transition-all ${isSynced
                    ? 'text-green-500'
                    : 'text-gray-600 opacity-0 group-hover:opacity-100 hover:text-blue-500'
                    }`}
                title={isSynced ? 'Synced to cloud' : 'Upload to cloud'}
            >
                {isSynced ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                )}
            </button>

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

            {/* Play button (visible on hover) */}
            <button
                onClick={handlePlay}
                className="w-10 h-10 rounded-full bg-sonexa-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-sonexa-primary/90"
            >
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
            </button>
        </div>
    );
}
