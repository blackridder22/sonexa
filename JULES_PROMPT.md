### Prompt for Jules

**Your task is to find and fix a single, verifiable bug within this repository that is causing a blank white screen on startup.** Please follow these steps meticulously:

**1. Codebase Analysis & Bug Identification**:
Systematically analyze the codebase to identify the root cause of the blank screen issue. The application is built with Electron, React, TypeScript, and Vite. When running in development mode (`npm run dev`), the Electron window opens, but the React application fails to render, resulting in an empty HTML document (`<html><head></head><body></body></html>`).

The bug is likely located in the interaction between the Electron main process, the Vite development server, and the React renderer process. There are no errors in the browser console or the terminal, which makes this a challenging bug to diagnose.

**Key files to investigate:**
*   `electron/main.ts`: The entry point for the Electron main process, which creates the `BrowserWindow` and loads the URL.
*   `vite.config.ts`: The configuration for the Vite dev server.
*   `index.html`: The root HTML file that the React app is mounted to.
*   `src/main.tsx`: The entry point for the React application, where the `App` component is rendered.
*   `package.json`: To review the scripts and dependencies.

**2. Detailed Bug Report**:
Before writing any code, provide a brief report explaining:
*   The file and line number(s) where the bug is located.
*   A clear description of the bug and its impact (i.e., why it's causing the blank screen).
*   Your proposed strategy for fixing it.

**3. Targeted Fix Implementation**:
Implement the most direct and clean fix for the identified bug. Avoid making unrelated refactors or style changes in the process.

**4. Verification Through Testing**:
To validate your fix, you must:
*   Describe the expected outcome: After the fix, running `npm run dev` should result in the application window displaying the "Hello from Sonexa!" message on a black background (as defined in the simplified `src/App.tsx`).
*   Run the `npm run dev` command and confirm that the application's UI is now visible and the blank screen issue is resolved.

**Visual Context:**
Please refer to the screenshot `@Screenshot 2025-10-06 at 7.53.43 PM.png` which shows the blank white screen that is the subject of this debugging task.