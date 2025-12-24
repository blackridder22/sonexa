import { useState, useEffect, useCallback } from 'react';
import SettingsModal from './components/SettingsModal';
import ImportDropzone from './components/ImportDropzone';

// File record interface (matches preload)
interface FileRecord {
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

function App() {
    const [appVersion, setAppVersion] = useState<string>('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'music' | 'sfx' | 'favorites'>('all');

    // Load files from database
    const loadFiles = useCallback(async () => {
        if (!window.sonexa) return;

        try {
            const type = activeTab === 'music' ? 'music' : activeTab === 'sfx' ? 'sfx' : undefined;
            const loadedFiles = await window.sonexa.listFiles(type);
            setFiles(loadedFiles);
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }, [activeTab]);

    useEffect(() => {
        // Get app version from Electron
        if (window.sonexa) {
            window.sonexa.getAppVersion().then(setAppVersion).catch(console.error);

            // Listen for open-settings event from main process (CMD+,)
            const unsubscribe = window.sonexa.onOpenSettings(() => {
                setIsSettingsOpen(true);
            });

            // Initial file load
            loadFiles();

            return unsubscribe;
        }
    }, [loadFiles]);

    // Reload files when tab changes
    useEffect(() => {
        loadFiles();
    }, [activeTab, loadFiles]);

    // Keyboard shortcut handler (backup for CMD+,)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                setIsSettingsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    const tabs = [
        { id: 'all', label: 'All Files' },
        { id: 'music', label: 'Music' },
        { id: 'sfx', label: 'SFX' },
        { id: 'favorites', label: 'Favorites' },
    ] as const;

    return (
        <div className="min-h-screen bg-sonexa-dark text-white">
            {/* Draggable titlebar region for macOS */}
            <div className="h-12 w-full drag-region flex items-center justify-center border-b border-sonexa-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sonexa-primary to-sonexa-secondary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <h1 className="text-lg font-semibold tracking-tight">
                        Sonexa <span className="text-sonexa-primary">— Dev</span>
                    </h1>
                    {appVersion && (
                        <span className="text-xs text-gray-500 ml-2">v{appVersion}</span>
                    )}
                </div>
            </div>

            {/* Main content area */}
            <main className="flex h-[calc(100vh-3rem)]">
                {/* Sidebar */}
                <aside className="w-64 bg-sonexa-darker border-r border-sonexa-border p-4">
                    <nav className="space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-sonexa-surface text-white font-medium'
                                        : 'text-gray-400 hover:bg-sonexa-surface hover:text-white'
                                    }`}
                            >
                                {tab.label}
                                {tab.id !== 'favorites' && (
                                    <span className="float-right text-xs text-gray-500">
                                        {tab.id === 'all'
                                            ? files.length
                                            : files.filter(f => f.type === tab.id).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Content area */}
                <div className="flex-1 p-6 overflow-auto">
                    {files.length === 0 ? (
                        <ImportDropzone onImportComplete={loadFiles} />
                    ) : (
                        <div className="space-y-2">
                            {/* File list header */}
                            <div className="flex items-center gap-4 px-4 py-2 text-sm text-gray-500 border-b border-sonexa-border">
                                <span className="flex-1">Name</span>
                                <span className="w-20 text-right">Duration</span>
                                <span className="w-20 text-right">Size</span>
                                <span className="w-16 text-center">Type</span>
                            </div>

                            {/* File list */}
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-4 px-4 py-3 rounded-lg bg-sonexa-surface/50 hover:bg-sonexa-surface transition-colors cursor-pointer group"
                                    draggable
                                    onDragStart={(e) => {
                                        e.preventDefault();
                                        // Native drag will be implemented in T7
                                        if (window.sonexa) {
                                            window.sonexa.startDrag(file.path, '');
                                        }
                                    }}
                                >
                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sonexa-primary/30 to-sonexa-secondary/30 flex items-center justify-center">
                                        {file.type === 'music' ? (
                                            <svg className="w-5 h-5 text-sonexa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-sonexa-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0-12a4 4 0 00-4 4v4a4 4 0 008 0v-4a4 4 0 00-4-4z" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Filename */}
                                    <span className="flex-1 truncate font-medium">{file.filename}</span>

                                    {/* Duration */}
                                    <span className="w-20 text-right text-gray-400 text-sm">
                                        {file.duration > 0 ? formatDuration(file.duration) : '--:--'}
                                    </span>

                                    {/* Size */}
                                    <span className="w-20 text-right text-gray-400 text-sm">
                                        {formatSize(file.size)}
                                    </span>

                                    {/* Type badge */}
                                    <span className={`w-16 text-center text-xs px-2 py-1 rounded-full ${file.type === 'music'
                                            ? 'bg-sonexa-primary/20 text-sonexa-primary'
                                            : 'bg-sonexa-secondary/20 text-sonexa-secondary'
                                        }`}>
                                        {file.type.toUpperCase()}
                                    </span>

                                    {/* Cloud status */}
                                    <div className="w-6">
                                        {file.cloud_url ? (
                                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Drop zone for additional imports */}
                            <div className="mt-4 p-4 border-2 border-dashed border-sonexa-border rounded-lg text-center text-gray-500 hover:border-sonexa-primary hover:text-gray-400 transition-colors">
                                <ImportDropzone onImportComplete={loadFiles} />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}

export default App;
