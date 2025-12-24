import { useState, useCallback } from 'react';

interface ImportDropzoneProps {
    onImportComplete?: () => void;
}

interface ImportProgress {
    current: number;
    total: number;
    filename: string;
}

export default function ImportDropzone({ onImportComplete }: ImportDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState<ImportProgress | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!window.sonexa) return;

        const files = Array.from(e.dataTransfer.files);
        const filePaths = files.map((f) => (f as File & { path: string }).path).filter(Boolean);

        if (filePaths.length === 0) return;

        setIsImporting(true);
        setProgress({ current: 0, total: filePaths.length, filename: '' });

        try {
            const result = await window.sonexa.importFiles(filePaths);

            console.log('Import results:', result);

            // Show completion message
            const successCount = result.success.length;
            const duplicateCount = result.duplicates.length;
            const failedCount = result.failed.length;

            if (successCount > 0 || duplicateCount > 0 || failedCount > 0) {
                let message = '';
                if (successCount > 0) message += `${successCount} file(s) imported. `;
                if (duplicateCount > 0) message += `${duplicateCount} duplicate(s) skipped. `;
                if (failedCount > 0) message += `${failedCount} failed.`;
                console.log(message);
            }

            onImportComplete?.();
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setIsImporting(false);
            setProgress(null);
        }
    }, [onImportComplete]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
        flex flex-col items-center justify-center h-full text-center
        transition-all duration-300 rounded-2xl border-2 border-dashed
        ${isDragging
                    ? 'border-sonexa-primary bg-sonexa-primary/10 scale-[1.02]'
                    : 'border-transparent'
                }
        ${isImporting ? 'pointer-events-none opacity-70' : ''}
      `}
        >
            {isImporting ? (
                <>
                    <div className="w-16 h-16 rounded-full bg-sonexa-primary/20 flex items-center justify-center mb-4 animate-pulse">
                        <svg
                            className="w-8 h-8 text-sonexa-primary animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Importing...</h2>
                    {progress && (
                        <p className="text-gray-400">
                            {progress.current} / {progress.total} files
                        </p>
                    )}
                </>
            ) : isDragging ? (
                <>
                    <div className="w-24 h-24 rounded-2xl bg-sonexa-primary/20 flex items-center justify-center mb-6 animate-bounce">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-12 h-12 text-sonexa-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2 text-sonexa-primary">
                        Drop files here
                    </h2>
                    <p className="text-gray-400">Release to import audio files</p>
                </>
            ) : (
                <>
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-sonexa-primary/20 to-sonexa-secondary/20 flex items-center justify-center mb-6">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-12 h-12 text-sonexa-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Welcome to Sonexa</h2>
                    <p className="text-gray-400 max-w-md">
                        Your private audio library for music and sound effects.
                        <br />
                        <span className="text-sonexa-primary font-medium">
                            Drag audio files here to import
                        </span>
                        , or press{' '}
                        <kbd className="px-2 py-1 bg-sonexa-surface rounded text-sm font-mono">
                            CMD + ,
                        </kbd>{' '}
                        to configure settings.
                    </p>
                </>
            )}
        </div>
    );
}
