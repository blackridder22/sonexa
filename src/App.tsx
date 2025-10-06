import React, { useState, useEffect } from 'react';
import SettingsModal from './components/SettingsModal';

declare global {
  interface Window {
    sonexa: {
      onOpenSettings: (callback: () => void) => void;
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
    <div className="App">
      <header className="App-header">
        <h1>Sonexa — Dev</h1>
      </header>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default App;
