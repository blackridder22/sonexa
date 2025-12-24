# ASSUMPTIONS.md

This document records all defaults and assumptions made during development of Sonexa MVP.

## Language & Runtime
- **Language**: TypeScript for both Electron main process and React renderer
- **Node Version**: >= 18 (required for native modules)

## Frontend
- **Framework**: React 18+
- **Build Tool**: Vite (fast HMR, ESM-first)
- **Styling**: Tailwind CSS v3
- **Bundling**: Vite for renderer, tsc for Electron main

## Electron
- **Version**: Electron 28+ (latest stable)
- **Context Isolation**: Enabled (security best practice)
- **Node Integration**: Disabled in renderer (security best practice)
- **Preload Script**: Used to expose safe IPC APIs via `contextBridge`

## Database
- **Local DB**: SQLite via `better-sqlite3` (synchronous, desktop-friendly)
- **Schema**: Single `files` table with metadata (see docs.md for schema)
- **FTS**: SQLite FTS5 for search (post-MVP enhancement)

## File Storage
- **Default Library Path**: `~/SonexaLibrary`
- **File Organization**: `{libraryPath}/{type}/{uuid}.{ext}` (e.g., `~/SonexaLibrary/music/abc123.wav`)
- **Hash Algorithm**: SHA-1 for file deduplication

## Audio
- **Playback Library**: howler.js (web audio abstraction, reliable)
- **Duration Extraction**: `ffprobe` via ffmpeg package or pure JS audio-metadata if no native deps needed

## Settings & Secrets
- **General Settings**: `electron-store` (JSON file in app data)
- **Secrets (Supabase Key)**: `keytar` (OS keychain)

## Cloud Sync (Supabase)
- **Bucket Name**: `sonexa-files`
- **Conflict Resolution**: Last-modified-wins (MVP simplicity)
- **Auth**: User provides service key in Settings (MVP); OAuth in future

## Packaging
- **Tool**: `electron-builder`
- **Mac Output**: `.dmg`
- **Signing**: Optional for dev (documented for production)

## Git Conventions
- **Branch Naming**: `feature/<task-short>` (e.g., `feature/boilerplate`)
- **Commit Prefix**: `feat:` for features, `chore:` for config/setup

## Development Scripts
- **Dev**: `npm run dev` runs Vite and Electron concurrently
- **Build Renderer**: `npm run build:renderer` builds React app
- **Build Electron**: `npm run build:electron` compiles TS main process
- **Package**: `npm run package` creates distributable

---

*Last updated: 2024-12-24*
