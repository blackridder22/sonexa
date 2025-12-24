# Sonexa MVP — Task Plan

This document outlines the sprint tasks for building the Sonexa MVP.

---

## T0 — Read Specs & Setup Repo ✅
- [x] Read `docs.md` completely
- [x] Create `README.md`
- [x] Create `ASSUMPTIONS.md`
- [x] Create `.gitignore`
- [x] Create `package.json` skeleton
- [x] Create `task-plan.md`

**Branch**: `feature/init`

---

## T1 — Boilerplate: Vite + React + Tailwind + Electron
- [ ] Install all dependencies (React, Vite, Tailwind, Electron, types)
- [ ] Create `vite.config.ts`
- [ ] Create `tsconfig.json`
- [ ] Create `electron/main.ts`
- [ ] Create `electron/preload.ts`
- [ ] Create `src/main.tsx` and `src/App.tsx`
- [ ] Create `index.html`
- [ ] Create `tailwind.config.cjs` and `postcss.config.cjs`
- [ ] Add dev scripts (dev, build:renderer, build:electron, package)
- [ ] Verify `npm run dev` opens Electron window with "Sonexa — Dev"

**Branch**: `feature/boilerplate`

---

## T2 — App Menu + Settings Shortcut (CMD+,)
- [ ] Create macOS application menu in `electron/menu.ts`
- [ ] Add Settings item with `CmdOrCtrl+,` accelerator
- [ ] Send IPC `open-settings` to renderer on menu click
- [ ] Expose `sonexa.openSettings()` in preload
- [ ] Create `src/components/SettingsModal.tsx` skeleton
- [ ] Wire modal to open on `CMD+,`

**Branch**: `feature/settings-shortcut`

---

## T3 — Settings Persistence (electron-store + keytar)
- [ ] Add `electron-store` for general settings
- [ ] Add `keytar` for secure Supabase key storage
- [ ] Expose `sonexa.getSettings()` / `setSettings()` in preload
- [ ] Expose `sonexa.getSecret()` / `setSecret()` for keytar
- [ ] Wire Settings modal to persist values

**Branch**: `feature/settings-persistence`

---

## T4 — Local Library Import
- [ ] Create `native/storage.ts` for file operations
- [ ] Create `native/db.ts` with SQLite setup
- [ ] Implement drag-drop import in renderer
- [ ] Copy files to library path
- [ ] Extract metadata (duration, size, hash)
- [ ] Insert records into SQLite
- [ ] Show import progress toast

**Branch**: `feature/import`

---

## T5 — File List UI (Music / SFX tabs)
- [ ] Create `src/components/Sidebar.tsx` with tabs
- [ ] Create `src/components/FileList.tsx`
- [ ] Create `src/components/FileCard.tsx`
- [ ] Fetch files via `sonexa.listFiles()` IPC
- [ ] Display files with filtering by type

**Branch**: `feature/file-list`

---

## T6 — Audio Preview (howler.js)
- [ ] Integrate howler.js in renderer
- [ ] Create `Player` component (play/pause/seek/loop)
- [ ] Connect FileCard to Player
- [ ] Add spacebar toggle for play/pause

**Branch**: `feature/audio-preview`

---

## T7 — Native Drag to External Apps
- [ ] Implement `sonexa.startDrag(filePath, iconPath)` in preload
- [ ] Handle `start-drag` IPC in main process
- [ ] Call `event.sender.startDrag()` with file path
- [ ] Test drag into Finder and Premiere

**Branch**: `feature/native-drag`

---

## T8 — Supabase Basic Sync (Upload Only)
- [ ] Add Supabase client in main process
- [ ] Create `native/supabase.ts` with `uploadFile()`
- [ ] Store Supabase URL/key from Settings (keytar)
- [ ] Add Upload button to FileCard
- [ ] Update local DB with cloud URL on success

**Branch**: `feature/supabase-upload`

---

## T9 — Delete Cache + Auto-Sync Worker
- [ ] Implement Delete Cache (remove files + clear DB)
- [ ] Add confirmation dialog
- [ ] Implement auto-sync toggle
- [ ] Background sync worker (simple loop)
- [ ] Display sync status and last sync time

**Branch**: `feature/cache-sync`

---

## T10 — Build & Packaging
- [ ] Add `electron-builder` config
- [ ] Configure `package.json` build settings
- [ ] Add `npm run package` script
- [ ] Document signing/notarization steps

**Branch**: `feature/packaging`

---

## T11 — QA & Polish
- [ ] Add ESLint + Prettier configs
- [ ] Add basic unit tests
- [ ] Final README updates
- [ ] Tag as `v0.1.0-mvp`

**Branch**: `release/v0.1.0-mvp`

---

*Last updated: 2024-12-24*
