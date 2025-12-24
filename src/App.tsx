import { useState, useEffect } from 'react';

function App() {
    const [appVersion, setAppVersion] = useState<string>('');

    useEffect(() => {
        // Get app version from Electron
        if (window.sonexa) {
            window.sonexa.getAppVersion().then(setAppVersion).catch(console.error);
        }
    }, []);

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
                {/* Sidebar placeholder */}
                <aside className="w-64 bg-sonexa-darker border-r border-sonexa-border p-4">
                    <nav className="space-y-2">
                        <div className="px-3 py-2 rounded-lg bg-sonexa-surface text-white font-medium">
                            All Files
                        </div>
                        <div className="px-3 py-2 rounded-lg text-gray-400 hover:bg-sonexa-surface hover:text-white transition-colors cursor-pointer">
                            Music
                        </div>
                        <div className="px-3 py-2 rounded-lg text-gray-400 hover:bg-sonexa-surface hover:text-white transition-colors cursor-pointer">
                            SFX
                        </div>
                        <div className="px-3 py-2 rounded-lg text-gray-400 hover:bg-sonexa-surface hover:text-white transition-colors cursor-pointer">
                            Favorites
                        </div>
                    </nav>
                </aside>

                {/* Content area */}
                <div className="flex-1 p-6">
                    <div className="flex flex-col items-center justify-center h-full text-center">
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
                            Your private audio library for music and sound effects. Drag files
                            here to import, or press <kbd className="px-2 py-1 bg-sonexa-surface rounded text-sm font-mono">CMD + ,</kbd> to
                            configure settings.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
