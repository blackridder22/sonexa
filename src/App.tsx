import { useState, useEffect, useCallback } from 'react';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import FileList from './components/FileList';
import { FileRecord } from './components/FileCard';

function App() {
    const [appVersion, setAppVersion] = useState<string>('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
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

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // CMD+, for settings
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                setIsSettingsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Get counts for sidebar
    const getCounts = () => {
        const allFiles = files;
        return {
            all: allFiles.length,
            music: allFiles.filter(f => f.type === 'music').length,
            sfx: allFiles.filter(f => f.type === 'sfx').length,
            favorites: 0, // TODO: implement favorites
        };
    };

    // Handle file play (will be implemented in T6)
    const handlePlayFile = (file: FileRecord) => {
        console.log('Play file:', file.filename);
        setSelectedFile(file);
        // T6 will implement actual playback
    };

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
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={getCounts()}
                />

                {/* File list */}
                <div className="flex-1 bg-sonexa-dark">
                    <FileList
                        files={files}
                        selectedFile={selectedFile}
                        onSelectFile={setSelectedFile}
                        onPlayFile={handlePlayFile}
                        onImportComplete={loadFiles}
                    />
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
