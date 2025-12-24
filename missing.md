# Missing Analysis & Gap Identification

## 1. Architectural Gaps

### Local Database Migrations
**Gap:** The current plan (`native/db.ts`) defines the schema but lacks a migration system.
**Why it matters:** As the app revolves, schema changes (e.g., adding `waveform_data` or new tag structures) will break existing local databases without a versioned migration strategy (e.g., `user_version` pragma in SQLite).

### Handling Native Dependencies
**Gap:** The build pipeline (`T10`) mentions `electron-builder` but doesn't explicitly account for native node module recompilation.
**Why it matters:** `better-sqlite3` and `keytar` are native modules. They must be recompiled against the specific Electron V8 version using `electron-rebuild` or strictly configured in `.npmrc` to avoid runtime crashes (`NODE_MODULE_VERSION` mismatch).

### Off-Main-Thread Processing
**Gap:** File hashing (SHA-1) and metadata extraction for large libraries are CPU-intensive.
**Why it matters:** Doing this in the main process (even async) or renderer can freeze the UI. A dedicated `Worker` thread or a separate child process for file ingestion is recommended to keep the app responsive during large imports.

## 2. Functional Omissions

### File System Watcher
**Gap:** The app relies on explicit "Drag-Drop Import". It does not appear to watch the `~/SonexaLibrary` folder for external changes.
**Why it matters:** If a user moves files into the library folder via Finder, Sonexa won't detect them, leading to library desync. `chokidar` or `fs.watch` integration is missing.

### Supabase Security Model Clarification
**Gap:** The documentation suggests users might enter a "Service Key".
**Why it matters:** Distributing an app where users enter a Service Key (admin privileges) is a high-risk pattern unless this is a strictly self-hosted "BYO-Backend" model. If it is a SaaS, the client should never touch the Service Key. If it's BYO, the UI must fundamentally warn users about the privileges they are granting.

### Auto-Update Mechanism
**Gap:** `T10` covers packaging but omits auto-update logic.
**Why it matters:** Desktop apps require seamless updates. Integrating `electron-updater` and a release server (e.g., GitHub Releases) is standard/critical for MVP lifecycle management.

## 3. User Experience (UX) Edge Cases

### File Import Conflict Logic
**Gap:** T4 mentions "copy files to library path". It does not specify behavior for file name collisions (e.g., importing two different `kick.wav` files).
**Missing Definition:** Should it Auto-rename? Overwrite? Skip? Prompt user?

### Offline Verification & Sync Queue
**Gap:** The "Auto-Sync Worker" (T9) describes a simple loop.
**Missing Definition:** There is no defined behavior for handling sync failures (retries, backoff) or queuing actions taken while offline.

### First-Run Onboarding
**Gap:** No defined flow for the very first launch.
**Why it matters:** The app assumes a library path. The first launch should ideally trigger a "Welcome/Setup" wizard to confirm existing library location or create a default one before the main UI loads.

## 4. Tech Stack Specifics

### Metadata Extraction Library
**Gap:** `ASSUMPTIONS.md` suggests `ffprobe` or "pure JS".
**Recommendation:** `ffprobe` adds significant binary size (50MB+). pure JS libraries like `music-metadata` are preferred for Electron apps unless video support is strictly required. This decision needs to be made before T4 to avoid technical debt.
