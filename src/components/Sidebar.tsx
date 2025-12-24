interface SidebarProps {
    activeTab: 'all' | 'music' | 'sfx' | 'favorites';
    onTabChange: (tab: 'all' | 'music' | 'sfx' | 'favorites') => void;
    counts: {
        all: number;
        music: number;
        sfx: number;
        favorites: number;
    };
}

const tabs = [
    { id: 'all', label: 'All Files', icon: '📁' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'sfx', label: 'SFX', icon: '🔊' },
    { id: 'favorites', label: 'Favorites', icon: '⭐' },
] as const;

export default function Sidebar({ activeTab, onTabChange, counts }: SidebarProps) {
    return (
        <aside className="w-64 bg-sonexa-darker border-r border-sonexa-border flex flex-col">
            {/* Logo section */}
            <div className="p-4 border-b border-sonexa-border">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="bg-transparent flex-1 outline-none placeholder-gray-500 text-white text-sm"
                    />
                </div>
            </div>

            {/* Navigation tabs */}
            <nav className="flex-1 p-4 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                    Library
                </p>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-sonexa-surface text-white shadow-lg shadow-sonexa-primary/10'
                                : 'text-gray-400 hover:bg-sonexa-surface/50 hover:text-white'
                            }`}
                    >
                        <span className="text-lg">{tab.icon}</span>
                        <span className="flex-1 text-left font-medium">{tab.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id
                                ? 'bg-sonexa-primary/20 text-sonexa-primary'
                                : 'bg-sonexa-surface text-gray-500'
                            }`}>
                            {counts[tab.id]}
                        </span>
                    </button>
                ))}
            </nav>

            {/* Footer with storage info */}
            <div className="p-4 border-t border-sonexa-border">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <span>{counts.all} files in library</span>
                </div>
            </div>
        </aside>
    );
}
