# Sonexa Setup & Troubleshooting Guide

## The Error You're Seeing

```
Error: No handler registered for 'list-files'
Error: No handler registered for 'import-files'
```

**Root Cause:** The Electron main process needs to be recompiled after code changes. The compiled JavaScript (`dist-electron/main.js`) is outdated.

---

## How to Fix It (Run These Commands)

```bash
# Step 1: Stop the dev server (Ctrl+C if running)

# Step 2: Rebuild the Electron main process
npm run build:electron

# Step 3: Restart the dev server
npm run dev
```

That's it! The app should now work correctly.

---

## About Supabase (Optional for MVP)

**You do NOT need Supabase configured for local import to work.** Supabase is only needed for cloud sync (T8). 

For MVP local functionality:
- ✅ Drag & drop import works WITHOUT Supabase
- ✅ Local library works WITHOUT Supabase
- ✅ Audio playback works WITHOUT Supabase

You can leave Supabase URL/Key empty in Settings. Configure it later when you want cloud sync.

---

## About the Library Path

When you drag files into Sonexa:
1. The app **automatically creates** the library folder structure
2. Files are copied to `~/SonexaLibrary/music/` or `~/SonexaLibrary/sfx/`
3. Metadata is stored in SQLite database

**You don't need to create any folders manually.** The app creates:
- `~/SonexaLibrary/` (or your custom path)
- `~/SonexaLibrary/music/`
- `~/SonexaLibrary/sfx/`

---

## Quick Start Steps

1. **Rebuild Electron:** `npm run build:electron`
2. **Start app:** `npm run dev`
3. **Drag audio files** (WAV, MP3, etc.) into the app
4. Files should appear in the list!
5. **Double-click** to play

---

## If It Still Doesn't Work

Check these:

1. **Is the library path valid?**
   - Press `CMD + ,` to open Settings
   - Verify the Local Library Path exists (default: `~/SonexaLibrary`)

2. **Are you dragging supported audio files?**
   - Supported: `.mp3`, `.wav`, `.aiff`, `.flac`, `.ogg`, `.m4a`

3. **Check the console for specific errors**
   - The Electron dev console shows detailed error messages

---

## Development Tip

**Always run `npm run build:electron` after modifying any file in the `electron/` or `native/` folders.** These are Node.js TypeScript files that need compilation before Electron can use them.

The Vite dev server (React) hot-reloads automatically, but Electron main process does not.
