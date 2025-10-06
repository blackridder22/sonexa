import { importFiles, deleteLibrary } from '../native/storage';
import fs from 'fs';
import path from 'path';

const testDir = path.join(__dirname, 'test_assets');
const libraryDir = path.join(__dirname, 'test_library');

describe('storage', () => {
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    fs.writeFileSync(path.join(testDir, 'test.mp3'), 'dummy content');
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    deleteLibrary(libraryDir);
  });

  it('should import a file', async () => {
    const filesToImport = [path.join(testDir, 'test.mp3')];
    const importedFiles = await importFiles(filesToImport, libraryDir);
    expect(importedFiles.length).toBe(1);
    expect(fs.existsSync(importedFiles[0].path)).toBe(true);
  });
});
