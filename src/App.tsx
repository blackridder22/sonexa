import { useState, useEffect, useCallback } from 'react';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import FileList from './components/FileList';
import Player from './components/Player';
import ToastContainer, { showToast, hideToast } from './components/Toast';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Onboarding from './components/Onboarding';
import { FileRecord } from './components/FileCard';

function App() {
    const [appVersion, setAppVersion] = useState<string>('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null); // null = loading
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [selectedCloudFiles, setSelectedCloudFiles] = useState<string[]>([]); // storagePaths
    const [playingFile, setPlayingFile] = useState<FileRecord | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'music' | 'sfx' | 'cloud' | 'favorites'>('all');
    const [counts, setCounts] = useState({ all: 0, music: 0, sfx: 0, cloud: 0, favorites: 0 });

    // Load file counts (always get totals)
    const loadCounts = useCallback(async () => {
        if (!window.sonexa) return;
        try {
            const newCounts = await window.sonexa.getFileCounts();
            // Also get cloud-only count
            const syncStatus = await window.sonexa.getSyncStatus();
            setCounts({ ...newCounts, cloud: syncStatus.downloadNeeded });
        } catch (error) {
            console.error('Failed to load counts:', error);
        }
    }, []);

    // Load cloud-only files (optionally filtered by type)
    const loadCloudFiles = useCallback(async (filterType?: 'music' | 'sfx') => {
        if (!window.sonexa) return;
        try {
            // Get cloud files (filtered by type if provided)
            const allCloudFiles = await window.sonexa.listCloudFiles(filterType);
            // Get local files to filter out already downloaded
            const localFiles = await window.sonexa.listFiles();
            const localCloudIds = new Set(localFiles.filter(f => f.cloud_id).map(f => f.cloud_id));

            // Filter to cloud-only (not downloaded)
            const cloudOnly = allCloudFiles.filter(cf => !localCloudIds.has(cf.storagePath));

            setCloudFiles(cloudOnly);
        } catch (error) {
            console.error('Failed to load cloud files:', error);
        }
    }, []);

    // Load files from database
    const loadFiles = useCallback(async () => {
        if (!window.sonexa) return;

        try {
            if (activeTab === 'cloud') {
                // Cloud tab: show all cloud-only files
                await loadCloudFiles();
                setFiles([]);
                setSelectedFiles([]);
                loadCounts();
                return;
            }

            // Load local files
            const type = activeTab === 'all' ? undefined : (activeTab === 'favorites' ? undefined : activeTab as 'music' | 'sfx');
            const loadedFiles = activeTab === 'favorites'
                ? (await window.sonexa.listFiles()).filter(f => f.favorite === 1)
                : await window.sonexa.listFiles(type);
            setFiles(loadedFiles);

            // For all/music/sfx tabs, also load cloud-only files
            if (activeTab === 'all' || activeTab === 'music' || activeTab === 'sfx') {
                const filterType = activeTab === 'all' ? undefined : activeTab;
                await loadCloudFiles(filterType);
            } else {
                setCloudFiles([]);
            }

            setSelectedFiles([]);
            loadCounts();
        } catch (error) {
            console.error('Failed to load files:', error);
        }
    }, [activeTab, loadCounts, loadCloudFiles]);

    useEffect(() => {
        // Get app version from Electron
        if (window.sonexa) {
            window.sonexa.getAppVersion().then(setAppVersion).catch(console.error);

            // Check if onboarding is complete
            window.sonexa.getSettings().then(settings => {
                setShowOnboarding(!settings.onboardingComplete);

                // Apply theme
                const theme = settings.theme || 'system';
                const applyTheme = (t: string) => {
                    if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                };

                applyTheme(theme);

                // Listen for system changes if system theme
                if (theme === 'system') {
                    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                    const handleChange = () => {
                        applyTheme('system');
                    };
                    mediaQuery.addEventListener('change', handleChange);
                }
            });

            // Listen for open-settings event from main process (CMD+,)
            const unsubscribeSettings = window.sonexa.onOpenSettings(() => {
                setIsSettingsOpen(true);
            });

            // Listen for import-files-dialog event from main process (CMD+O)
            const unsubscribeImport = window.sonexa.onImportFilesDialog(async () => {
                try {
                    const filePaths = await window.sonexa.chooseFiles();
                    if (filePaths.length > 0) {
                        await window.sonexa.importFiles(filePaths);
                        loadFiles();
                    }
                } catch (error) {
                    console.error('Import failed:', error);
                }
            });

            // Listen for library updates from file system watcher
            const unsubscribeLibrary = window.sonexa.onLibraryUpdated((data) => {
                console.log('Library updated:', data);
                loadFiles(); // Refresh file list when files added/removed externally
            });

            // Initial file load (only if onboarding complete)
            loadFiles();

            return () => {
                unsubscribeSettings();
                unsubscribeImport();
                unsubscribeLibrary();
            };
        }
    }, [loadFiles]);

    // Reload files when tab changes
    useEffect(() => {
        loadFiles();
    }, [activeTab, loadFiles]);

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // CMD+, for settings
            if ((e.metaKey || e.ctrlKey) && e.key === ',') {
                e.preventDefault();
                setIsSettingsOpen(true);
            }

            // CMD+A to select all
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault();
                setSelectedFiles(files.map(f => f.id));
            }

            // Escape to deselect
            if (e.key === 'Escape') {
                setSelectedFiles([]);
            }

            // Delete key to delete selected
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFiles.length > 0) {
                e.preventDefault();
                handleDeleteSelected();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [files, selectedFiles]);

    // Handle delete - show modal
    const handleDeleteSelected = () => {
        if (selectedFiles.length === 0 && selectedCloudFiles.length === 0) return;
        setIsDeleteModalOpen(true);
    };

    // Perform actual deletion
    const handleConfirmDelete = async ({ deleteLocal, deleteCloud }: { deleteLocal: boolean; deleteCloud: boolean }) => {
        if (!window.sonexa) return;

        try {
            // Delete local files
            if (deleteLocal && selectedFiles.length > 0) {
                // Get cloud URLs of local files to potentially delete from cloud too
                const localFilesWithCloud = files.filter(f =>
                    selectedFiles.includes(f.id) && f.cloud_url
                );

                await window.sonexa.deleteFiles(selectedFiles);

                // If also deleting cloud, delete the cloud copies of local files
                if (deleteCloud && localFilesWithCloud.length > 0) {
                    const cloudPaths = localFilesWithCloud.map(f => f.cloud_id || f.cloud_url).filter(Boolean) as string[];
                    if (cloudPaths.length > 0) {
                        await window.sonexa.deleteCloudFiles(cloudPaths);
                    }
                }
            }

            // Delete cloud-only files (from cloud tab)
            if (deleteCloud && selectedCloudFiles.length > 0) {
                await window.sonexa.deleteCloudFiles(selectedCloudFiles);
            }

            showToast('success', 'Files deleted successfully');
            setSelectedFiles([]);
            setSelectedCloudFiles([]);
            loadFiles();
        } catch (error) {
            console.error('Delete failed:', error);
            showToast('error', 'Delete failed');
        }
    };

    // Handle file selection
    const handleSelectFile = (fileId: string, multi?: boolean) => {
        if (multi) {
            // Toggle selection
            setSelectedFiles(prev =>
                prev.includes(fileId)
                    ? prev.filter(id => id !== fileId)
                    : [...prev, fileId]
            );
        } else {
            // Single select
            setSelectedFiles(prev =>
                prev.includes(fileId) && prev.length === 1
                    ? []
                    : [fileId]
            );
        }
    };

    // Handle select all / deselect all toggle
    const handleSelectAll = () => {
        if (activeTab === 'cloud') {
            // Toggle cloud files
            const allSelected = selectedCloudFiles.length === cloudFiles.length;
            if (allSelected) {
                setSelectedCloudFiles([]);
            } else {
                setSelectedCloudFiles(cloudFiles.map(cf => cf.storagePath));
            }
            setSelectedFiles([]);
        } else {
            // Toggle local files + cloud files
            const allLocalSelected = selectedFiles.length === files.length;
            const allCloudSelected = cloudFiles.length === 0 || selectedCloudFiles.length === cloudFiles.length;

            if (allLocalSelected && allCloudSelected) {
                // Deselect all
                setSelectedFiles([]);
                setSelectedCloudFiles([]);
            } else {
                // Select all
                setSelectedFiles(files.map(f => f.id));
                if (cloudFiles.length > 0) {
                    setSelectedCloudFiles(cloudFiles.map(cf => cf.storagePath));
                }
            }
        }
    };

    // Handle cloud file selection
    const handleSelectCloudFile = (storagePath: string, multi?: boolean) => {
        if (multi) {
            setSelectedCloudFiles(prev =>
                prev.includes(storagePath)
                    ? prev.filter(p => p !== storagePath)
                    : [...prev, storagePath]
            );
        } else {
            setSelectedCloudFiles(prev =>
                prev.includes(storagePath) && prev.length === 1
                    ? []
                    : [storagePath]
            );
        }
    };

    // Deselect local files only (keep cloud selected)
    const handleDeselectLocal = () => {
        setSelectedFiles([]);
    };

    // Deselect cloud files only (keep local selected)
    const handleDeselectCloud = () => {
        setSelectedCloudFiles([]);
    };

    // Handle toggle favorite
    const handleToggleFavorite = async (file: FileRecord) => {
        if (!window.sonexa) return;
        await window.sonexa.updateFile(file.id, { favorite: file.favorite === 1 ? 0 : 1 });
        loadFiles();
    };

    // Handle cloud upload
    const handleUpload = async (file: FileRecord) => {
        if (!window.sonexa) return;

        try {
            const configured = await window.sonexa.isSupabaseConfigured();
            if (!configured) {
                showToast('error', 'Please configure Supabase URL and key in Settings (⌘,)');
                setIsSettingsOpen(true);
                return;
            }

            const toastId = showToast('sync', `Uploading ${file.filename}...`);

            await window.sonexa.uploadFile(file.id);

            hideToast(toastId);
            showToast('success', `Uploaded ${file.filename}`);
            loadFiles(); // Refresh to show cloud status
        } catch (error) {
            console.error('Upload failed:', error);
            showToast('error', `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Handle file play
    const handlePlayFile = (file: FileRecord) => {
        setPlayingFile(file);
    };

    // Handle player close
    const handleClosePlayer = () => {
        setPlayingFile(null);
    };

    // Handle onboarding complete
    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        loadFiles();
    };

    // Loading state while checking onboarding
    if (showOnboarding === null) {
        return (
            <div className="min-h-screen bg-sonexa-bg flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-sonexa-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    // Show onboarding if not complete
    if (showOnboarding) {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    return (
        <div className="min-h-screen bg-sonexa-bg text-sonexa-text">
            {/* Draggable titlebar region for macOS */}
            <div className="h-12 w-full drag-region flex items-center justify-center border-b border-sonexa-border">
                <div className="flex items-center gap-3">
                    <img src="./icons/Top-Logo-Gold.png" alt="Sonexa" className="w-8 h-8 object-contain" />
                    <h1 className="text-lg font-semibold tracking-tight">
                        Sonexa <span className="text-sonexa-primary">— Dev</span>
                    </h1>
                    {appVersion && (
                        <span className="text-xs text-sonexa-text-muted ml-2">v{appVersion}</span>
                    )}
                </div>
            </div>

            {/* Main content area */}
            <main className={`flex ${playingFile ? 'h-[calc(100vh-3rem-4.5rem)]' : 'h-[calc(100vh-3rem)]'}`}>
                {/* Sidebar */}
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={counts}
                    onSyncComplete={loadFiles}
                />

                {/* File list */}
                <div className="flex-1 bg-sonexa-bg overflow-hidden">
                    <FileList
                        files={files}
                        cloudFiles={cloudFiles}
                        selectedFiles={selectedFiles}
                        selectedCloudFiles={selectedCloudFiles}
                        onSelectFile={handleSelectFile}
                        onSelectCloudFile={handleSelectCloudFile}
                        onSelectAll={handleSelectAll}
                        onPlayFile={handlePlayFile}
                        onImportComplete={loadFiles}
                        onToggleFavorite={handleToggleFavorite}
                        onUpload={handleUpload}
                        onDeleteSelected={handleDeleteSelected}
                        onDeselectLocal={handleDeselectLocal}
                        onDeselectCloud={handleDeselectCloud}
                        forceType={activeTab === 'music' || activeTab === 'sfx' ? activeTab : undefined}
                        isCloudTab={activeTab === 'cloud'}
                    />
                </div>
            </main>

            {/* Audio Player */}
            <Player
                file={playingFile}
                onClose={handleClosePlayer}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* Delete Confirm Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                fileCount={selectedFiles.length + selectedCloudFiles.length}
                hasCloudFiles={selectedCloudFiles.length > 0}
                hasLocalFiles={selectedFiles.length > 0}
                hasLocalWithCloud={files.some(f => selectedFiles.includes(f.id) && f.cloud_url)}
                onDelete={handleConfirmDelete}
            />

            {/* Toast notifications */}
            <ToastContainer />
        </div>
    );
}

export default App;
