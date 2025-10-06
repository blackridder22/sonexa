# TASK LIST (Task-by-Task) — do them in order

### T0 — READ SPECS & SETUP REPO (mandatory)

**Goal:** Read `@Docs.md`, create `README.md` and `ASSUMPTIONS.md` and initialize repo files skeleton.

**Steps**

1. Read `@Docs.md` completely.
2. Create `README.md` (short), and `ASSUMPTIONS.md` listing any defaults you pick.
3. Create `.gitignore` and `package.json` skeleton (no heavy installs yet).
4. Create `task-plan.md` with the sprint tasks.

**Deliverables**

* `README.md`, `ASSUMPTIONS.md`, `.gitignore`, `package.json` (skeleton), `task-plan.md`.

**Acceptance Criteria**

* Files created and committed to branch `feature/init`.
* JSON progress returned.

**Manual tests**

* `cat` the files to verify content.

---

### T1 — BOILERPLATE: Vite + React + Tailwind + Electron integration

**Goal:** Bootstrapped dev environment: `npm run dev` starts Vite and Electron (window loads React app).

**Steps**

1. Install dependencies (React, Vite, Tailwind, electron, types).
2. Add `vite.config.ts` and `tsconfig.json`.
3. Create `electron/main.ts`, `electron/preload.ts`, and `src/main.tsx`, `index.html`.
4. Add dev scripts:

   * `dev`: runs Vite and Electron together (use concurrently or a simple script).
   * `build:renderer`, `build:electron`, `package`.
5. Minimal UI: App displays `Sonexa — Dev` header.

**Files to create**

* `package.json` (full), `vite.config.ts`, `tsconfig.json`, `electron/main.ts`, `electron/preload.ts`, `src/main.tsx`, `src/App.tsx`, `index.html`, `tailwind.config.cjs`, `postcss.config.cjs`

**Acceptance Criteria**

* Running `npm run dev` opens a window that displays `Sonexa — Dev` (or logs making dev server reachable).
* Commit to `feature/boilerplate`.

**Manual tests**

* `npm run dev` → ensure renderer loads `http://localhost:5173` and Electron window appears.
* Provide run logs.

---

### T2 — APP MENU + Settings Shortcut (`CMD+,`) + Settings modal skeleton

**Goal:** App menu includes Sonexa menu with `Settings` item bound to `CmdOrCtrl+,` that opens a Settings modal in renderer.

**Steps**

1. Implement macOS application menu template in `electron/menu.ts` or inside `main.ts`.
2. `main` sends IPC `open-settings` to renderer.
3. Preload exposes a `sonexa.openSettings()` API.
4. `src/components/SettingsModal.tsx` — modal skeleton which shows fields: Supabase URL, Supabase Key (masked), Local Library Path, AutoSync toggle, Delete Cache button.
5. Settings modal should open when `Cmd+,` pressed or from the menu.

**Acceptance Criteria**

* Pressing `CMD+,` opens settings modal.
* The modal shows the input fields (no persistence yet).
* Commit to `feature/settings-shortcut`.

**Manual tests**

* In dev: press CMD+, → modal opens.

---

### T3 — SETTINGS PERSISTENCE (electron-store + keytar)

**Goal:** Save settings persistently and securely store Supabase key.

**Steps**

1. Add `electron-store` usage in `main` (or via helpers) to store `localLibraryPath`, `autoSync`, `lastSyncAt`.
2. Add `keytar` to store `supabaseKey`.
3. Preload exposes `sonexa.getSettings()` and `sonexa.setSettings()` and `sonexa.getSecret()`/`setSecret()`.
4. Settings modal wires up to these APIs and persists values.

**Acceptance Criteria**

* Filling settings in modal and hitting Save persists values across restarts.
* Supabase key is stored in `keytar` (no plain text in store).
* Commit to `feature/settings-persistence`.

**Manual tests**

* Set a path and key, quit app, reopen — values persist.

---

### T4 — LOCAL LIBRARY: import files (drag from Finder) → copy into library + insert into SQLite

**Goal:** User can drag files from Finder into Sonexa renderer; app copies files into `~/SonexaLibrary` (default) and inserts metadata into SQLite.

**Steps**

1. Create `native/storage.ts` helper to ensure library path, copy files, compute SHA-1 hash, extract duration (using `ffprobe` or `audio-metadata` node package; prefer lightweight JS lib).
2. Create `native/db.ts` — create SQLite DB with `files` table (schema from `@Docs.md`).
3. Implement renderer drop area: when files are dropped, call `preload.importFiles(paths)` which calls main to copy file(s) and insert metadata.
4. Show progress toast for import.

**Files to create**

* `native/storage.ts`, `native/db.ts`, `src/components/ImportDropzone.tsx`

**Acceptance Criteria**

* Dropping `example.wav` copies it to `~/SonexaLibrary/music/<uuid>.wav` (or similar) and inserts a DB row with `filename`, `path`, `duration`, `size`, `created_at`.
* Commit to `feature/import`.

**Manual tests**

* Drop a small WAV/MP3 — confirm file exists and DB record created: `sqlite3 sonexa.db "select * from files;"`.

---

### T5 — LIST UI (Music / SFX tabs) + FileCard

**Goal:** Display the imported files in a browsable list with tabs Music / SFX.

**Steps**

1. Implement `src/components/Sidebar.tsx` with tabs (All, Music, SFX, Favorites).
2. Implement `src/components/FileList.tsx` which fetches files via `sonexa.listFiles()` (preload->ipc).
3. `src/components/FileCard.tsx` shows filename, duration, size, tags, and an icon for cloud status.

**Acceptance Criteria**

* Imported files show up immediately under the correct tab.
* Commit to `feature/file-list`.

**Manual tests**

* Import 3 files: 2 SFX, 1 Music → verify tab filtering.

---

### T6 — AUDIO PREVIEW (howler.js) + basic player UI

**Goal:** Play/pause/loop a selected file inside app.

**Steps**

1. Integrate `howler.js` in renderer; implement `Player` component: play/pause, seek (basic), loop toggle.
2. Connect FileCard to open file in Player.

**Acceptance Criteria**

* Clicking Play previews audio with low latency.
* Spacebar toggles play/pause.
* Commit to `feature/audio-preview`.

**Manual tests**

* Play an imported track, press space, toggle loop.

---

### T7 — NATIVE DRAG TO EXTERNAL APPS (startDrag)

**Goal:** Implement native drag so users can drag a file from Sonexa into Premiere/Resolve and the NLE accepts it.

**Steps**

1. In renderer, on drag start call `sonexa.startDrag(filePath, iconPath)`.
2. Preload bridges to `ipcRenderer.invoke('start-drag', filePath, iconPath)`.
3. Main process handles `ipcMain.handle('start-drag', ...)` and calls `event.sender.startDrag({ file: filePath, icon: iconPath })`.
4. Ensure the file exists at a real file path (not in-memory). If file is in an internal cache, write to temp and pass that path.

**Acceptance Criteria**

* Dragging a FileCard into Premiere or Finder results in a real file drop (equivalent to dragging from Finder).
* Commit to `feature/native-drag`.

**Manual tests**

* Drag an item into Finder — a copy appears. Drag into Premiere timeline — file inserts.

---

### T8 — SUPABASE BASIC SYNC (upload only)

**Goal:** Implement upload to Supabase storage and record metadata in Supabase Postgres.

**Steps**

1. Add Supabase client in `main` (not renderer). Store Supabase URL & key securely via `keytar`.
2. Implement `native/supabase.ts` with `uploadFile(localPath)` that uploads to bucket `sonexa-files` and returns `publicURL` (or storage path).
3. UI: FileCard has button “Upload” which calls `sonexa.uploadFile(fileId)`.
4. On success mark cloud status in local DB.

**Acceptance Criteria**

* Uploading a file results in a valid Supabase storage object and local DB updated with cloud URL.
* Commit to `feature/supabase-upload`.

**Manual tests**

* With valid Supabase config in Settings, upload a file and confirm in Supabase console.

> **Security note:** For MVP you can accept user-provided service key. Document in README that keys are stored in OS key storage.

---

### T9 — DELETE CACHE, AUTO-SYNC WORKER

**Goal:** Implement Delete Cache and a background auto-sync worker (simple loop).

**Steps**

1. Implement Delete Cache: removes local library files and clears DB (confirmation dialog).
2. Auto-sync: when enabled, every X minutes check remote metadata and push/pull changes (last-modified-wins). Keep simple: only upload new local files for MVP.
3. Provide UI show sync status & last sync time.

**Acceptance Criteria**

* Delete Cache removes files & DB records.
* Auto-sync can be toggled and displays last sync time.
* Commit to `feature/cache-sync`.

**Manual tests**

* Click Delete Cache -> confirm -> confirm files removed.
* Toggle auto-sync -> simulate new import -> confirm upload started.

---

### T10 — BUILD & PACKAGING (electron-builder)

**Goal:** Add packaging support and a build script producing a `.dmg` for Mac.

**Steps**

1. Add `electron-builder` config in `package.json` or `electron-builder.yml`.
2. Confirm `npm run package` builds renderer and packages the app.
3. Document signing / notarization steps in `README.md` (optional).

**Acceptance Criteria**

* `npm run package` produces an artifact (or logs that artifact would be produced; if CI signing missing, just produce unsigned dmg).
* Commit to `feature/packaging`.

**Manual tests**

* Run `npm run package` locally and report build logs and artifact path.

---

### T11 — QA & SMALL POLISH (basic tests, lint, README)

**Goal:** Final cleanup: add README, basic unit tests (if sensible), ESLint/Prettier config, and ensure all previous tasks are committed in small atomic commits.

**Steps**

1. Add ESLint + Prettier configs.
2. Add basic tests for storage helper functions (e.g., copyFile produces file).
3. Final README with how-to-run and dev notes.
4. Tag the repo commit as `v0.1.0-mvp` (or create release notes).

**Acceptance Criteria**

* Linter passes, basic tests run.
* README clearly explains how to run dev & where to set Supabase keys.
* Commit to `release/v0.1.0-mvp`.