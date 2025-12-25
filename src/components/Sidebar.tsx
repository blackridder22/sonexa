import { useState, useEffect } from 'react';
import { showToast, hideToast } from './Toast';

interface SidebarProps {
    activeTab: 'all' | 'music' | 'sfx' | 'cloud' | 'favorites';
    onTabChange: (tab: 'all' | 'music' | 'sfx' | 'cloud' | 'favorites') => void;
    counts: {
        all: number;
        music: number;
        sfx: number;
        cloud: number;
        favorites: number;
    };
    onSyncComplete?: () => void;
}

interface NavItem {
    id: 'all' | 'music' | 'sfx' | 'cloud' | 'favorites';
    label: string;
    icon: string;
    color: string;
}

const navItems: NavItem[] = [
    { id: 'all', label: 'All Files', icon: '/icons/folder.png', color: 'text-blue-400' },
    { id: 'music', label: 'Music', icon: '/icons/music.png', color: 'text-sonexa-primary' },
    { id: 'sfx', label: 'SFX', icon: '/icons/sfx.png', color: 'text-sonexa-secondary' },
    { id: 'cloud', label: 'Cloud', icon: '/icons/cloud.png', color: 'text-cyan-400' },
    { id: 'favorites', label: 'Favorites', icon: '/icons/star.png', color: 'text-yellow-400' },
];

export default function Sidebar({ activeTab, onTabChange, counts, onSyncComplete }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [syncStatus, setSyncStatus] = useState({ uploadNeeded: 0, downloadNeeded: 0, configured: false });
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

    // Load sync status
    useEffect(() => {
        const loadSyncStatus = async () => {
            if (!window.sonexa) return;
            try {
                const status = await window.sonexa.getSyncStatus();
                setSyncStatus(status);
            } catch (e) {
                console.error('Failed to get sync status:', e);
            }
        };

        loadSyncStatus();

        // Refresh every 30 seconds
        const interval = setInterval(loadSyncStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load last sync time from settings
    useEffect(() => {
        const loadSettings = async () => {
            if (!window.sonexa) return;
            try {
                const settings = await window.sonexa.getSettings();
                setLastSyncTime(settings.lastSyncAt || null);
            } catch (e) {
                console.error('Failed to get settings:', e);
            }
        };
        loadSettings();
    }, []);

    // Handle full bi-directional sync
    const handleSyncAll = async () => {
        if (!window.sonexa || isSyncing) return;

        try {
            if (!syncStatus.configured) {
                showToast('error', 'Please configure Supabase in Settings (⌘,)');
                return;
            }

            setIsSyncing(true);
            const totalItems = syncStatus.uploadNeeded + syncStatus.downloadNeeded;
            const toastId = showToast('sync', `Syncing ${totalItems} files...`);

            const result = await window.sonexa.fullSync();

            hideToast(toastId);

            const messages = [];
            if (result.uploaded > 0) messages.push(`↑${result.uploaded} uploaded`);
            if (result.downloaded > 0) messages.push(`↓${result.downloaded} downloaded`);

            if (messages.length > 0) {
                showToast('success', messages.join(', '));
            } else {
                showToast('info', 'Already in sync!');
            }

            setSyncStatus({ uploadNeeded: 0, downloadNeeded: 0, configured: true });
            setLastSyncTime(result.time);
            onSyncComplete?.();
        } catch (error) {
            console.error('Sync failed:', error);
            showToast('error', `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSyncing(false);
        }
    };

    // Format time ago
    const formatTimeAgo = (isoString: string): string => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;

        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const totalNeeded = syncStatus.uploadNeeded + syncStatus.downloadNeeded;

    return (
        <div
            className={`
                h-full bg-sonexa-surface border-r border-sonexa-border flex flex-col
                transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-16' : 'w-64'}
            `}
        >
            {/* Collapse toggle */}
            <div className="p-3 flex justify-end">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-lg text-sonexa-text-muted hover:text-sonexa-text hover:bg-sonexa-surface-hover transition-colors"
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 space-y-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const count = counts[item.id];

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                                ${isActive
                                    ? 'bg-sonexa-primary/20 text-sonexa-text'
                                    : 'text-sonexa-text-muted hover:bg-sonexa-surface-hover hover:text-sonexa-text'
                                }
                                ${isCollapsed ? 'justify-center' : ''}
                            `}
                            title={isCollapsed ? `${item.label} (${count})` : undefined}
                        >
                            {/* Icon */}
                            <img
                                src={item.icon}
                                alt={item.label}
                                className={`w-5 h-5 object-contain ${isActive ? 'opacity-100' : 'opacity-70'}`}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />

                            {/* Label and count */}
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 text-left font-medium">{item.label}</span>
                                    <span className={`
                                        text-xs px-2 py-0.5 rounded-full
                                        ${isActive ? 'bg-sonexa-primary/30 text-sonexa-primary' : 'bg-sonexa-bg text-sonexa-text-muted'}
                                    `}>
                                        {count}
                                    </span>
                                </>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Sync section */}
            <div className="px-2 pb-2">
                <button
                    onClick={handleSyncAll}
                    disabled={isSyncing || totalNeeded === 0}
                    className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        ${totalNeeded > 0
                            ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                            : 'text-sonexa-text-muted cursor-not-allowed'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? `Sync ${totalNeeded} files` : undefined}
                >
                    {isSyncing ? (
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 text-left font-medium">
                                {isSyncing ? 'Syncing...' : 'Sync All'}
                            </span>
                            {totalNeeded > 0 && (
                                <div className="flex gap-1">
                                    {syncStatus.uploadNeeded > 0 && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20" title="To upload">
                                            ↑{syncStatus.uploadNeeded}
                                        </span>
                                    )}
                                    {syncStatus.downloadNeeded > 0 && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400" title="To download">
                                            ↓{syncStatus.downloadNeeded}
                                        </span>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </button>
            </div>

            {/* Footer */}
            {!isCollapsed && (
                <div className="p-4 border-t border-sonexa-border space-y-2">
                    {lastSyncTime && (
                        <p className="text-xs text-sonexa-text-muted text-center">
                            Last sync: {formatTimeAgo(lastSyncTime)}
                        </p>
                    )}
                    <p className="text-xs text-sonexa-text-muted text-center">
                        Press <kbd className="px-1.5 py-0.5 bg-sonexa-surface-hover rounded text-sonexa-text-muted">⌘,</kbd> for settings
                    </p>
                </div>
            )}
        </div>
    );
}
