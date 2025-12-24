import { useState, useCallback } from 'react';

interface ImportDropzoneProps {
    onImportComplete?: () => void;
    forceType?: 'music' | 'sfx';
}

interface ImportProgress {
    current: number;
    total: number;
    filename: string;
}

export default function ImportDropzone({ onImportComplete, forceType }: ImportDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState<ImportProgress | null>(null);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!window.sonexa) {
            console.error('Sonexa API not available');
            return;
        }

        // Get file paths from drop event
        const files = Array.from(e.dataTransfer.files);
        const filePaths = files
            .map((file) => (file as File & { path: string }).path)
            .filter(Boolean);

        if (filePaths.length === 0) {
            console.warn('No valid file paths found');
            return;
        }

        setIsImporting(true);
        setProgress({ current: 0, total: filePaths.length, filename: '' });

        try {
            const result = await window.sonexa.importFiles(filePaths, forceType);

            console.log('Import results:', result);

            if (result.failed.length > 0) {
                console.warn('Some files failed to import:', result.failed);
            }

            if (result.duplicates.length > 0) {
                console.info('Duplicate files skipped:', result.duplicates);
            }

            onImportComplete?.();
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setIsImporting(false);
            setProgress(null);
        }
    }, [onImportComplete, forceType]);

    const handleBrowse = async () => {
        if (!window.sonexa) return;

        const filePaths = await window.sonexa.chooseFiles();
        if (filePaths.length === 0) return;

        setIsImporting(true);
        setProgress({ current: 0, total: filePaths.length, filename: '' });

        try {
            const result = await window.sonexa.importFiles(filePaths, forceType);
            console.log('Import results:', result);
            onImportComplete?.();
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setIsImporting(false);
            setProgress(null);
        }
    };

    return (
        <div
            className={`
                h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300
                ${isDragging
                    ? 'border-sonexa-primary bg-sonexa-primary/10 scale-[1.02]'
                    : 'border-sonexa-border hover:border-gray-600'
                }
                ${isImporting ? 'pointer-events-none opacity-75' : ''}
            `}
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
            }}
            onDrop={handleDrop}
        >
            {isImporting ? (
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-sonexa-border"></div>
                        <div
                            className="absolute inset-0 rounded-full border-4 border-sonexa-primary border-t-transparent animate-spin"
                        ></div>
                    </div>
                    <p className="text-lg font-medium text-white mb-2">
                        Importing...
                    </p>
                    {progress && (
                        <p className="text-sm text-gray-400">
                            {progress.current} / {progress.total} files
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-center px-6">
                    {/* Icon */}
                    <div className={`
                        w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300
                        ${isDragging
                            ? 'bg-sonexa-primary/20 scale-110'
                            : 'bg-sonexa-surface'
                        }
                    `}>
                        <svg
                            className={`w-10 h-10 transition-colors ${isDragging ? 'text-sonexa-primary' : 'text-gray-500'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>

                    {/* Text */}
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {isDragging ? 'Drop to import' : 'Drop audio files here'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        or
                    </p>

                    {/* Browse button */}
                    <button
                        onClick={handleBrowse}
                        className="px-6 py-3 bg-sonexa-primary hover:bg-sonexa-primary/90 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105"
                    >
                        Browse Files
                    </button>

                    <p className="text-xs text-gray-600 mt-6">
                        Supports MP3, WAV, AIFF, FLAC, OGG, M4A
                    </p>
                </div>
            )}
        </div>
    );
}
