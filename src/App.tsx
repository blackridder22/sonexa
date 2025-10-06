import React, { useState, useEffect } from 'react';
import SettingsModal from './components/SettingsModal';
import ImportDropzone from './components/ImportDropzone';

declare global {
  interface Window {
    sonexa: {
      onOpenSettings: (callback: () => void) => void;
      getSettings: () => Promise<any>;
      setSettings: (settings: any) => Promise<void>;
      getSupabaseKey: () => Promise<string | null>;
      setSupabaseKey: (key: string) => Promise<void>;
      importFiles: (filePaths: string[]) => Promise<any[]>;
    };
  }
}

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    window.sonexa.onOpenSettings(() => {
      setIsSettingsOpen(true);
    });
  }, []);

  return (
    <div className="App h-screen flex flex-col">
      <header className="App-header p-4 border-b">
        <h1 className="text-xl font-bold">Sonexa — Dev</h1>
      </header>
      <main className="flex-grow p-4">
        <ImportDropzone />
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
