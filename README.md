# Sonexa

Sonexa is a macOS-first desktop app for video editors to manage both music and sound effects. The app supports offline mode and cloud sync using Supabase.

## Features

- **Local Library:** Import and manage your audio files locally.
- **Music & SFX:** Organize your library into music and sound effects.
- **Audio Preview:** Play and preview your audio files.
- **Native Drag & Drop:** Drag files directly into your favorite video editing software.
- **Supabase Sync:** Optionally sync your library to the cloud with Supabase.

## Tech Stack

- **Electron**
- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **better-sqlite3**
- **howler.js**
- **Supabase**

## Development

To run the app in development mode:

```bash
npm install
npm run dev
```

## Building

To build the application for production, run the following command:

```bash
npm run package
```

This will create a `.dmg` file in the `release` directory.

**Note on Code Signing:** For macOS, you will need to set up an Apple Developer account and configure `electron-builder` with your signing certificates to distribute the application.
