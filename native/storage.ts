import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const defaultLibraryPath = path.join(app.getPath('home'), 'SonexaLibrary');

function ensureLibraryPath(libraryPath: string) {
  if (!fs.existsSync(libraryPath)) {
    fs.mkdirSync(libraryPath, { recursive: true });
  }
  const musicPath = path.join(libraryPath, 'music');
  if (!fs.existsSync(musicPath)) {
    fs.mkdirSync(musicPath);
  }
  const sfxPath = path.join(libraryPath, 'sfx');
  if (!fs.existsSync(sfxPath)) {
    fs.mkdirSync(sfxPath);
  }
}

export async function importFiles(files: string[], libraryPath: string = defaultLibraryPath) {
  const { parseFile } = await import('music-metadata');
  const { v4: uuidv4 } = await import('uuid');

  ensureLibraryPath(libraryPath);

  const importedFiles = [];

  for (const filePath of files) {
    const metadata = await parseFile(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');

    const id = uuidv4();
    const type = metadata.common.album === 'Sound Effects' ? 'sfx' : 'music';
    const newFileName = `${id}${path.extname(filePath)}`;
    const newPath = path.join(libraryPath, type, newFileName);

    fs.copyFileSync(filePath, newPath);

    const fileData = {
      id,
      filename: path.basename(filePath),
      type,
      path: newPath,
      hash,
      duration: metadata.format.duration || 0,
      size: fs.statSync(newPath).size,
      tags: JSON.stringify(metadata.common.genre || []),
      bpm: metadata.common.bpm || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    importedFiles.push(fileData);
  }

  return importedFiles;
}

export function deleteLibrary(libraryPath: string = defaultLibraryPath) {
  if (fs.existsSync(libraryPath)) {
    fs.rmSync(libraryPath, { recursive: true, force: true });
  }
}
