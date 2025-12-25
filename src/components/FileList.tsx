import { useState } from 'react';
import FileCard, { FileRecord } from './FileCard';
import CloudFileCard, { CloudFile } from './CloudFileCard';
import ImportDropzone from './ImportDropzone';

interface FileListProps {
    files: FileRecord[];
    cloudFiles?: CloudFile[];
    selectedFiles: string[];
    selectedCloudFiles?: string[]; // storagePaths
    onSelectFile: (fileId: string, multi?: boolean) => void;
    onSelectCloudFile?: (storagePath: string, multi?: boolean) => void;
    onSelectAll?: () => void;
    onPlayFile?: (file: FileRecord) => void;
    onImportComplete?: () => void;
    onToggleFavorite?: (file: FileRecord) => void;
    onUpload?: (file: FileRecord) => void;
    onDeleteSelected?: () => void;
    onDeselectLocal?: () => void;
    onDeselectCloud?: () => void;
    forceType?: 'music' | 'sfx';
    isCloudTab?: boolean;
}

export default function FileList({
    files,
    cloudFiles = [],
    selectedFiles,
    selectedCloudFiles = [],
    onSelectFile,
    onSelectCloudFile,
    onSelectAll,
    onPlayFile,
    onImportComplete,
    onToggleFavorite,
    onUpload,
    onDeleteSelected,
    onDeselectLocal,
    onDeselectCloud,
    forceType,
    isCloudTab = false
}: FileListProps) {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    // Handle + button click to open file picker
    const handleAddFiles = async () => {
        if (!window.sonexa) return;

        const filePaths = await window.sonexa.chooseFiles();
        if (filePaths.length > 0) {
            await window.sonexa.importFiles(filePaths, forceType);
            onImportComplete?.();
        }
    };

    // Handle delete selected files
    const handleDeleteSelected = async () => {
        if (!window.sonexa || selectedFiles.length === 0) return;

        const confirmMsg = selectedFiles.length === 1
            ? 'Delete this file?'
            : `Delete ${selectedFiles.length} files?`;

        if (confirm(confirmMsg)) {
            await window.sonexa.deleteFiles(selectedFiles);
            onImportComplete?.();
        }
    };

    // Handle toggle favorite for selected files
    const handleToggleFavoriteSelected = async () => {
        if (!window.sonexa || selectedFiles.length === 0) return;

        // Get the first selected file to determine current state
        const firstSelected = files.find(f => f.id === selectedFiles[0]);
        const newFavorite = firstSelected?.favorite === 1 ? 0 : 1;

        for (const id of selectedFiles) {
            await window.sonexa.updateFile(id, { favorite: newFavorite });
        }
        onImportComplete?.();
    };

    // Handle drop on the list area
    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);

        if (!window.sonexa) return;

        const droppedFiles = Array.from(e.dataTransfer.files);
        const filePaths = droppedFiles
            .map((f) => (f as File & { path: string }).path)
            .filter(Boolean);

        if (filePaths.length > 0) {
            await window.sonexa.importFiles(filePaths, forceType);
            onImportComplete?.();
        }
    };

    // Cloud tab with no files - show cloud files if any, otherwise empty state
    if (isCloudTab) {
        if (cloudFiles.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-sonexa-text-muted p-6">
                    <img src="./icons/cloud.png" alt="Cloud" className="w-20 h-20 opacity-30 mb-4" />
                    <p className="text-lg font-medium">All synced!</p>
                    <p className="text-sm text-sonexa-text-muted">All cloud files are downloaded locally</p>
                </div>
            );
        }
        // Fall through to render cloud files below
    }

    // Non-cloud tab with no files - show import dropzone
    if (!isCloudTab && files.length === 0 && cloudFiles.length === 0) {
        return (
            <div className="h-full p-6">
                <ImportDropzone onImportComplete={onImportComplete} forceType={forceType} />
            </div>
        );
    }

    return (
        <div
            className="h-full flex flex-col relative"
            onDragOver={!isCloudTab ? (e) => {
                e.preventDefault();
                setIsDraggingOver(true);
            } : undefined}
            onDragLeave={!isCloudTab ? (e) => {
                e.preventDefault();
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDraggingOver(false);
                }
            } : undefined}
            onDrop={!isCloudTab ? handleDrop : undefined}
        >
            {/* Drag overlay - only for non-cloud tabs */}
            {!isCloudTab && isDraggingOver && (
                <div className="absolute inset-0 z-50 bg-sonexa-bg/90 backdrop-blur-sm flex items-center justify-center rounded-lg pointer-events-none">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-sonexa-primary/20 flex items-center justify-center">
                            <svg className="w-10 h-10 text-sonexa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-xl font-semibold text-sonexa-text">Drop files to import</p>
                        <p className="text-sm text-sonexa-text-muted mt-1">
                            {forceType ? `Will be added as ${forceType.toUpperCase()}` : 'Auto-detect type'}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sonexa-border">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">{files.length} files</h2>
                    {selectedFiles.length > 0 && (
                        <span className="text-sm text-sonexa-primary">
                            {selectedFiles.length} selected
                        </span>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {/* Add files button - not shown in cloud tab */}
                    {!isCloudTab && (
                        <button
                            onClick={handleAddFiles}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sonexa-primary hover:bg-sonexa-primary/90 text-white font-medium transition-colors"
                            title="Add files"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add
                        </button>
                    )}

                    {/* Select All button */}
                    {(files.length > 0 || cloudFiles.length > 0) && (
                        <button
                            onClick={onSelectAll}
                            className="px-3 py-2 rounded-lg bg-sonexa-surface text-sonexa-text-muted hover:text-sonexa-text transition-colors"
                            title="Select all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </button>
                    )}

                    {/* Favorite button (when local files selected) */}
                    {selectedFiles.length > 0 && !isCloudTab && (
                        <button
                            onClick={handleToggleFavoriteSelected}
                            className="p-2 rounded-lg bg-sonexa-surface text-yellow-500 hover:bg-yellow-500/20 transition-colors"
                            title="Toggle favorite"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </button>
                    )}

                    {/* Deselect Local button (when both local and cloud are selected) */}
                    {selectedFiles.length > 0 && selectedCloudFiles.length > 0 && (
                        <button
                            onClick={onDeselectLocal}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sonexa-surface text-sonexa-text-muted hover:text-sonexa-text transition-colors text-xs"
                            title="Deselect local files"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Local
                        </button>
                    )}

                    {/* Deselect Cloud button (when both local and cloud are selected) */}
                    {selectedFiles.length > 0 && selectedCloudFiles.length > 0 && (
                        <button
                            onClick={onDeselectCloud}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sonexa-surface text-cyan-400 hover:bg-cyan-500/20 transition-colors text-xs"
                            title="Deselect cloud files"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cloud
                        </button>
                    )}

                    {/* Delete button (when ANY files selected - local OR cloud) */}
                    {(selectedFiles.length > 0 || selectedCloudFiles.length > 0) && (
                        <button
                            onClick={onDeleteSelected || handleDeleteSelected}
                            className="p-2 rounded-lg bg-sonexa-surface text-red-500 hover:bg-red-500/20 transition-colors"
                            title="Delete selected"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}

                    {/* Divider */}
                    <div className="w-px h-6 bg-sonexa-border mx-2" />

                    {/* View mode buttons */}
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-sonexa-surface hover:text-sonexa-text text-sonexa-text' : 'text-sonexa-text-muted hover:text-sonexa-text'}`}
                        title="List view"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-sonexa-surface hover:text-sonexa-text text-sonexa-text' : 'text-sonexa-text-muted hover:text-sonexa-text'}`}
                        title="Grid view"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* File list/grid */}
            <div className={`flex-1 overflow-y-auto p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start' : 'space-y-2'}`}>
                {isCloudTab ? (
                    // Cloud tab: show only cloud-only files
                    cloudFiles.length > 0 ? (
                        cloudFiles.map((file) => (
                            <CloudFileCard
                                key={file.id}
                                file={file}
                                viewMode={viewMode}
                                isSelected={selectedCloudFiles.includes(file.storagePath)}
                                onSelect={onSelectCloudFile}
                                onDownloadComplete={onImportComplete}
                            />
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-sonexa-text-muted">
                            <img src="./icons/cloud.png" alt="Cloud" className="w-16 h-16 opacity-30 mb-4" />
                            <p className="text-lg font-medium">All caught up!</p>
                            <p className="text-sm">All cloud files are downloaded locally</p>
                        </div>
                    )
                ) : (
                    <>
                        {/* Local files */}
                        {files.map((file) => (
                            <FileCard
                                key={file.id}
                                file={file}
                                isSelected={selectedFiles.includes(file.id)}
                                onSelect={(f, multi) => onSelectFile(f.id, multi)}
                                onPlay={onPlayFile}
                                onToggleFavorite={onToggleFavorite}
                                onUpload={onUpload}
                                viewMode={viewMode}
                            />
                        ))}

                        {/* Cloud-only files (for music/sfx tabs) */}
                        {cloudFiles.length > 0 && (
                            <>
                                {/* Separator */}
                                {viewMode === 'list' && files.length > 0 && (
                                    <div className="flex items-center gap-3 py-3 text-sonexa-text-muted">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                                        <span className="text-xs flex items-center gap-2">
                                            <img src="./icons/cloud.png" alt="" className="w-4 h-4 opacity-50" />
                                            Cloud Only
                                        </span>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                                    </div>
                                )}
                                {cloudFiles.map((file) => (
                                    <CloudFileCard
                                        key={file.id}
                                        file={file}
                                        viewMode={viewMode}
                                        isSelected={selectedCloudFiles.includes(file.storagePath)}
                                        onSelect={onSelectCloudFile}
                                        onDownloadComplete={onImportComplete}
                                    />
                                ))}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
