import React, { useState, useEffect } from 'react';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import FileList from './components/FileList';
import Player from './components/Player';

declare global {
  interface Window {
    sonexa: {
      onOpenSettings: (callback: () => void) => void;
      getSettings: () => Promise<any>;
      setSettings: (settings: any) => Promise<void>;
      getSupabaseKey: () => Promise<string | null>;
      setSupabaseKey: (key: string) => Promise<void>;
      importFiles: (filePaths: string[]) => Promise<any[]>;
      listFiles: () => Promise<any[]>;
      startDrag: (filePath: string) => Promise<void>;
      uploadFile: (file: any) => Promise<any>;
    };
  }
}

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [currentFile, setCurrentFile] = useState(null);

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
      <div className="flex flex-grow overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <FileList activeTab={activeTab} onFileSelect={setCurrentFile} />
        <Player file={currentFile} />
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
