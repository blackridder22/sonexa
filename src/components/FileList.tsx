import FileCard, { FileRecord } from './FileCard';
import ImportDropzone from './ImportDropzone';

interface FileListProps {
    files: FileRecord[];
    selectedFile?: FileRecord | null;
    onSelectFile?: (file: FileRecord) => void;
    onPlayFile?: (file: FileRecord) => void;
    onImportComplete?: () => void;
}

export default function FileList({
    files,
    selectedFile,
    onSelectFile,
    onPlayFile,
    onImportComplete
}: FileListProps) {
    if (files.length === 0) {
        return (
            <div className="h-full p-6">
                <ImportDropzone onImportComplete={onImportComplete} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sonexa-border">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">{files.length} files</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{files.filter(f => f.type === 'music').length} music</span>
                        <span>•</span>
                        <span>{files.filter(f => f.type === 'sfx').length} sfx</span>
                    </div>
                </div>

                {/* View options */}
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-sonexa-surface text-white">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                    <button className="p-2 rounded-lg text-gray-500 hover:bg-sonexa-surface hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {files.map((file) => (
                    <FileCard
                        key={file.id}
                        file={file}
                        isSelected={selectedFile?.id === file.id}
                        onSelect={onSelectFile}
                        onPlay={onPlayFile}
                    />
                ))}
            </div>

            {/* Drop zone for additional imports */}
            <div className="p-4 border-t border-sonexa-border">
                <div
                    className="py-4 border-2 border-dashed border-sonexa-border rounded-xl text-center text-sm text-gray-500 hover:border-sonexa-primary hover:text-sonexa-primary transition-colors cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        // Trigger import through parent
                        const files = Array.from(e.dataTransfer.files);
                        const filePaths = files.map((f) => (f as File & { path: string }).path).filter(Boolean);
                        if (filePaths.length > 0 && window.sonexa) {
                            window.sonexa.importFiles(filePaths).then(() => onImportComplete?.());
                        }
                    }}
                >
                    Drop more files here to import
                </div>
            </div>
        </div>
    );
}
