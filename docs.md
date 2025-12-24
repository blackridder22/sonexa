Legendary — Sonexa is born. 🎉

Below is a complete, developer-ready project document for Sonexa: a desktop-first private audio library for Music + Sound FX, with offline storage on your Mac and optional cloud sync to Supabase. I’ll give you product intent, exact tech choices, folder structure, init commands, DB schema, SUPABASE wiring, core Electron patterns (including CMD+, settings and native drag-and-drop into NLEs), and an MVP roadmap so you can start coding immediately.

I kept it practical and opinionated so you can spin up a working prototype fast.

🎧 Sonexa — Private audio library (Desktop + Cloud)

Tagline: Sonexa — Your private audio library for music & SFX. Save locally on Mac, sync to the cloud, and drag files straight into Premiere / Resolve / Final Cut.

⸻

1) Product overview (short)

Sonexa is a macOS-first desktop app (later Windows/Linux) that lets editors and creators:
	•	import & organize both music and sound effects,
	•	preview quickly,
	•	tag & search,
	•	drag-and-drop native audio files directly into editing timelines,
	•	keep a local offline library plus optional cloud sync (Supabase storage + metadata).

Key UX: CMD + , opens Settings (API key, local library path, Delete Cache, toggle auto-sync).

⸻

2) Core features (MVP)
	•	Local import (drag-in from Finder can drag-out to Sonexa as well) → stored in local filesystem library + Indexed SQLite metadata.
	•	Two library modes/tabs: Music and SFX.
	•	Search, filter by tags, categories, BPM/length (if available).
	•	Quick preview (play/pause/loop).
	•	Native Drag & Drop: drag file from Sonexa into Premiere/Resolve & it pastes as a real file reference.
	•	Settings accessible via CMD+,:
	•	Enter Supabase URL/ANON or service key (for cloud sync).
	•	Choose local storage path for Sonexa library.
	•	Delete cache (clear local DB & files).
	•	Toggle auto-sync.
	•	Cloud sync (Supabase): upload files to storage bucket, keep metadata in Postgres table.
	•	Simple conflict resolution: last-modified-wins (MVP).

⸻

3) Tech stack (opinionated)
	•	UI: React (TypeScript) + Tailwind CSS
	•	Desktop: Electron (main + renderer) — TypeScript
	•	Offline DB: SQLite via better-sqlite3 (lightweight & fast)
	•	File storage (local): store audio in user-selected folder (e.g. ~/SonexaLibrary) with a hashed path scheme; store metadata in SQLite.
	•	Cloud: Supabase Storage + Postgres (metadata) — @supabase/supabase-js
	•	Settings persistence: electron-store + keytar for secrets
	•	Audio playback: howler.js or WebAudio API (renderer)
	•	Packaging: electron-builder for .dmg (mac)
	•	IPC: electron ipcMain/ipcRenderer + secure context bridging (contextIsolation)
	•	Search indexing: Simple SQL full-text index (SQLite FTS) or an in-memory index for speed

⸻

4) Repo / folder structure (starter)

sonexa/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ electron/
│  ├─ main.ts         # Electron main process (native drag, IPC, menu)
│  ├─ preload.ts      # Secure bridge, exposes safe APIs to renderer
│  └─ menu.ts         # App menu (includes CMD+, accelerator)
├─ src/               # React renderer
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ components/
│  ├─ hooks/
│  ├─ styles/
│  └─ ipc-client.ts   # wrapper around window.api (preload)
├─ native/
│  ├─ db.ts           # SQLite helpers (uses better-sqlite3)
│  ├─ storage.ts      # file copy/move helpers
│  └─ supabase.ts     # server-side supabase interactions (optional)
├─ assets/
└─ build/


⸻

5) Setup & initial commands (Mac dev)

Prereqs: Node >= 18, pnpm/yarn/npm, Xcode command line tools for packaging.


# install core deps
npm install react react-dom
npm install -D vite typescript @types/react @types/react-dom tailwindcss postcss autoprefixer

# electron deps
npm install electron @electron/remote electron-builder
npm install better-sqlite3 keytar electron-store @supabase/supabase-js howler

# types
npm install -D @types/node

Add scripts to package.json:

"scripts": {
  "dev": "concurrently \"vite\" \"electron .\"",
  "build:renderer": "vite build",
  "build:electron": "tsc -p tsconfig.json",
  "package": "electron-builder"
}

(You can use concurrently or a custom script to run both vite dev server and electron for development.)

⸻

6) Database schema (SQLite) — minimal

Use better-sqlite3 and create tables:

-- files table (local + cloud metadata)
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,          -- uuid
  filename TEXT,
  type TEXT,                    -- 'music' | 'sfx'
  path TEXT,                    -- absolute local path
  hash TEXT,                    -- checksum for conflict detection
  duration REAL,
  size INTEGER,
  tags TEXT,                    -- maybe JSON array stored as TEXT
  bpm INTEGER,
  created_at DATETIME,
  updated_at DATETIME,
  cloud_url TEXT,               -- remote storage path if uploaded
  cloud_id TEXT                 -- id in supabase metadata
);

-- optional: full text search (FTS)
CREATE VIRTUAL TABLE files_fts USING fts5(filename, tags, content='files', content_rowid='rowid');

Populate files_fts when inserting/updating files.

⸻

7) Settings & CMD+, (implementation notes)
	•	Create an application menu (mac template) in Electron menu.ts. Add a menu item with accelerator CmdOrCtrl+, that sends an IPC event to open the Settings in renderer.

Example (main process):

import { Menu } from 'electron';

const template = [
  {
    label: 'Sonexa',
    submenu: [
      { label: 'Settings', accelerator: 'Cmd+,', click: () => { mainWindow.webContents.send('open-settings'); } },
      { role: 'quit' }
    ]
  },
  // ... other menus
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

Renderer listens on preload-exposed API or ipcRenderer.on('open-settings', ...) to open settings modal.

Settings storage:
	•	Use electron-store for general settings (localPath, autoSync, lastSyncAt).
	•	Use keytar for securely storing Supabase service key / access token.

⸻

8) Native drag & drop to external apps (Premiere/Resolve)

You must use Electron main/webContents.startDrag to start a native drag with a file path so external apps accept it.

Flow:
	1.	In renderer, user drags an item → call window.api.startDrag(filePath, iconPath).
	2.	Preload bridges that to ipcRenderer.invoke('start-drag', filePath, iconPath).
	3.	In main process:

ipcMain.handle('start-drag', async (event, filePath, iconPath) => {
  const wc = event.sender;
  wc.startDrag({
    file: filePath,       // absolute path to the audio file
    icon: iconPath        // small PNG used as drag icon
  });
});

Important: the file must exist on disk with proper extension accepted by the NLE (e.g., .wav, .aiff, .mp3). For files stored in app cache, write them to a real file path in a temp or library folder and start drag from that path.

Result: Dragging will behave as if the user dragged a file from Finder — NLEs accept it.

⸻

9) Supabase integration (MVP)
	•	Create Supabase project → storage bucket sonexa-files.
	•	Metadata table files in Postgres with similar columns to SQLite table (id, filename, type, tags, duration, size, storage_path, user_id, updated_at).
	•	Strategy:
	•	On upload: copy file from local path to Supabase Storage (same filename or hashed), then insert metadata record into Postgres.
	•	On download / sync: compare updated_at timestamps between local and remote; if remote newer, download to local path and update SQLite.
	•	Authentication:
	•	For MVP, allow users to paste a service key or anon key in Settings. For production, implement OAuth or server relay.
	•	Use @supabase/supabase-js in the main process or in a secure server bridge to avoid exposing service keys in the renderer.

Example snippet (main process):

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadFile(localFilePath, destPath) {
  const fs = require('fs');
  const file = fs.createReadStream(localFilePath);
  const { data, error } = await supabase.storage.from('sonexa-files').upload(destPath, file);
  if (error) throw error;
  return data;
}

Note: For downloads, use download() and stream or write to disk.

⸻

10) Preload + IPC (secure)

Expose a minimal API through preload.ts so renderer can:
	•	list local files
	•	request startDrag
	•	open Settings
	•	trigger import
	•	trigger upload/download

Example preload.ts:

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('sonexa', {
  listFiles: () => ipcRenderer.invoke('list-files'),
  startDrag: (filePath, iconPath) => ipcRenderer.invoke('start-drag', filePath, iconPath),
  openSettings: () => ipcRenderer.send('open-settings'),
  importFiles: (paths) => ipcRenderer.invoke('import-files', paths),
  // ... more
});


⸻

11) UI suggestions (quick)
	•	Left sidebar: library sections (All / Music / SFX / Favorites / Cloud).
	•	Center list/grid: waveform thumbnail (small), filename, tags, duration, upload status icon.
	•	Right panel: preview player (play/loop/seek), tags editor, cloud sync button.
	•	Global hotkeys: space for play/pause; CMD+, for settings.

⸻

12) Security & packaging notes
	•	Store any Supabase service key in keytar (not plain text).
	•	If using anon/public keys, less risk — but be explicit to users.
	•	For packaging on Mac, sign the app if distribution outside your machine is planned (not required for dev).
	•	For Apple notarization, follow electron-builder docs.

⸻

13) Stretch goals (post-MVP)
	•	Offline waveform caching & fast scrubbing.
	•	Smart tags (extract tempo, key, spectral features via ffmpeg + a tiny audio analyzer).
	•	Batch upload and background sync daemon.
	•	Local network sync between multiple Sonexa instances (peer sync).
	•	Plugin integration: dedicated Premiere/Resolve panel extension (advanced).

⸻

14) MVP Implementation Plan (sprint-style)

Sprint 0 — Repo + Boilerplate
	•	Initialize repo, setup Vite + React + Tailwind + TypeScript.
	•	Add Electron main, preload, and Vite integration.
	•	Basic app window + menu with CMD+, that opens mock Settings.

Sprint 1 — Local import & DB
	•	Implement local path setting & accept drag-files into renderer.
	•	Copy files into ~/SonexaLibrary (create if not exist).
	•	Insert metadata into SQLite.
	•	Show files in UI list.

Sprint 2 — Preview & drag
	•	Add audio preview (howler).
	•	Implement start-drag flow to perform native drag to external apps.

Sprint 3 — Supabase basic
	•	Settings for supabase URL + key.
	•	Upload a selected file to Supabase storage and create metadata record.
	•	Show cloud status icon on UI.

Sprint 4 — Cache delete & polish
	•	Implement Delete Cache (delete local files + clear SQLite).
	•	Add autoscroll searches, tag editor, keyboard shortcuts.

⸻

15) Example minimal code snippets

Electron main (core parts simplified):

// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL('http://localhost:5173'); // vite dev
}

app.whenReady().then(() => {
  createWindow();
  // ... set menu with CMD+, calling mainWindow.webContents.send('open-settings')
});

ipcMain.handle('start-drag', (event, filePath, iconPath) => {
  event.sender.startDrag({ file: filePath, icon: iconPath });
});

Renderer: call startDrag

// src/components/FileCard.tsx
const onDragStart = () => {
  // ask main to start native drag
  window.sonexa.startDrag(file.path, '/path/to/icon.png');
};

// in JSX: <div onMouseDown={onDragStart}> ... </div>


⸻

16) Next immediate steps (pick one, I’ll generate code)

I can do any of the following next — pick one and I’ll produce it right away:
	1.	Generate the full repo scaffold with exact package.json, vite + electron configs and minimal working app (TypeScript).
	2.	Provide a detailed implementation file-by-file for main.ts, preload.ts, db.ts, App.tsx and minimal UI.
	3.	Draft the Supabase DB SQL + migration and sample upload/download functions.
	4.	Start with just the native drag & drop example fully wired (renderer + preload + main).
	5.	Create the Settings UI and show how to persist settings + store Supabase key using keytar.

Pick one and I’ll output the concrete code/files for it. No waiting — I’ll create the files in this chat.