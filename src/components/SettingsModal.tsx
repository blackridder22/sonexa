import { useState, useEffect } from 'react';

// Settings interface matching the electron-store schema
interface AppSettings {
    localLibraryPath: string;
    supabaseUrl: string;
    autoSync: boolean;
    lastSyncAt: string | null;
}

// Secret key constants
const SUPABASE_KEY = 'supabase-key';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [localLibraryPath, setLocalLibraryPath] = useState('~/SonexaLibrary');
    const [autoSync, setAutoSync] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings when modal opens
    useEffect(() => {
        if (isOpen && window.sonexa) {
            setIsLoading(true);
            Promise.all([
                window.sonexa.getSettings(),
                window.sonexa.getSecret(SUPABASE_KEY),
            ])
                .then(([settings, secretKey]) => {
                    setSupabaseUrl(settings.supabaseUrl || '');
                    setLocalLibraryPath(settings.localLibraryPath || '~/SonexaLibrary');
                    setAutoSync(settings.autoSync || false);
                    // Don't show actual key, just indicate if one exists
                    setSupabaseKey(secretKey ? '••••••••••••••••' : '');
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!window.sonexa) return;

        setIsSaving(true);
        try {
            // Save general settings
            await window.sonexa.setSettings({
                supabaseUrl,
                localLibraryPath,
                autoSync,
            });

            // Save secret key if it was changed (not the placeholder)
            if (supabaseKey && !supabaseKey.startsWith('••')) {
                await window.sonexa.setSecret(SUPABASE_KEY, supabaseKey);
            }

            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBrowse = async () => {
        if (!window.sonexa) return;

        const path = await window.sonexa.chooseDirectory();
        if (path) {
            setLocalLibraryPath(path);
        }
    };

    const handleDeleteCache = async () => {
        if (!window.sonexa) return;

        if (confirm('Are you sure you want to delete all cached files? This cannot be undone.')) {
            try {
                const result = await window.sonexa.deleteCache();
                alert(`Deleted ${result.filesDeleted} files and ${result.recordsDeleted} database records.`);
                window.location.reload(); // Reload to refresh file list
            } catch (error) {
                console.error('Failed to delete cache:', error);
                alert('Failed to delete cache. Please try again.');
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-sonexa-surface border border-sonexa-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-sonexa-border">
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-sonexa-border transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sonexa-primary"></div>
                        </div>
                    ) : (
                        <>
                            {/* Supabase URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Supabase URL
                                </label>
                                <input
                                    type="url"
                                    value={supabaseUrl}
                                    onChange={(e) => setSupabaseUrl(e.target.value)}
                                    placeholder="https://your-project.supabase.co"
                                    className="w-full px-4 py-2.5 bg-sonexa-dark border border-sonexa-border rounded-lg text-white placeholder-gray-500 focus:border-sonexa-primary focus:ring-1 focus:ring-sonexa-primary transition-colors"
                                />
                            </div>

                            {/* Supabase Key */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Supabase API Key
                                </label>
                                <input
                                    type="password"
                                    value={supabaseKey}
                                    onChange={(e) => setSupabaseKey(e.target.value)}
                                    placeholder="Your service or anon key"
                                    className="w-full px-4 py-2.5 bg-sonexa-dark border border-sonexa-border rounded-lg text-white placeholder-gray-500 focus:border-sonexa-primary focus:ring-1 focus:ring-sonexa-primary transition-colors"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    🔐 Stored securely in your system keychain (keytar)
                                </p>
                            </div>

                            {/* Local Library Path */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Local Library Path
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={localLibraryPath}
                                        onChange={(e) => setLocalLibraryPath(e.target.value)}
                                        placeholder="~/SonexaLibrary"
                                        className="flex-1 px-4 py-2.5 bg-sonexa-dark border border-sonexa-border rounded-lg text-white placeholder-gray-500 focus:border-sonexa-primary focus:ring-1 focus:ring-sonexa-primary transition-colors"
                                    />
                                    <button
                                        onClick={handleBrowse}
                                        className="px-4 py-2.5 bg-sonexa-dark border border-sonexa-border rounded-lg hover:bg-sonexa-border transition-colors"
                                    >
                                        Browse
                                    </button>
                                </div>
                            </div>

                            {/* Auto-sync Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300">
                                        Auto-sync
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        Automatically sync files with Supabase
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAutoSync(!autoSync)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSync ? 'bg-sonexa-primary' : 'bg-sonexa-border'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-4 border-t border-sonexa-border">
                                <h3 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h3>
                                <button
                                    onClick={handleDeleteCache}
                                    className="w-full px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    Delete Cache
                                </button>
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Removes all local files and clears the database
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-sonexa-border bg-sonexa-darker/50">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg border border-sonexa-border hover:bg-sonexa-border transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="px-4 py-2 rounded-lg bg-sonexa-primary hover:bg-sonexa-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
