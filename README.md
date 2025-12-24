# Sonexa

**Private audio library for Music & SFX** — Save locally on Mac, sync to the cloud, and drag files straight into Premiere / Resolve / Final Cut.

## Overview

Sonexa is a macOS-first desktop app built with Electron that lets video editors:
- Import & organize both music and sound effects
- Quick preview with low-latency playback
- Tag & search your library
- Drag-and-drop native audio files directly into NLE timelines
- Keep a local offline library + optional cloud sync via Supabase

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Electron (main + renderer)
- **Local DB**: SQLite via `better-sqlite3`
- **Cloud**: Supabase (Storage + Postgres)
- **Audio**: howler.js
- **Packaging**: electron-builder

## Development

```bash
# Install dependencies
npm install

# Run development mode (Vite + Electron)
npm run dev

# Build for production
npm run build:renderer
npm run build:electron
npm run package
```

## Settings

Press `CMD + ,` to open Settings where you can:
- Enter Supabase URL and API key (stored securely via keytar)
- Choose local library path (default: `~/SonexaLibrary`)
- Toggle auto-sync
- Delete local cache

## Security

Supabase service keys are stored securely using OS keychain via `keytar`. No plain text storage of secrets.

## License

MIT
