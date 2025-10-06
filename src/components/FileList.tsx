import React, { useState, useEffect } from 'react';
import FileCard from './FileCard';
import ImportDropzone from './ImportDropzone';

interface FileListProps {
  activeTab: string;
  onFileSelect: (file: any) => void;
}

const FileList: React.FC<FileListProps> = ({ activeTab, onFileSelect }) => {
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    const fetchFiles = () => {
      window.sonexa.listFiles().then((files) => {
        setFiles(files);
      });
    }
    fetchFiles();

    const handleFilesImported = () => fetchFiles();
    // This is a bit of a hack, we should have a proper event system
    document.addEventListener('files-imported', handleFilesImported);
    return () => document.removeEventListener('files-imported', handleFilesImported);
  }, []);

  const filteredFiles = files.filter(file => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Music') return file.type === 'music';
    if (activeTab === 'SFX') return file.type === 'sfx';
    // TODO: Implement favorites
    if (activeTab === 'Favorites') return false;
    return true;
  });

  return (
    <div className="flex-grow p-4 overflow-y-auto">
      <div className="h-32 mb-4">
        <ImportDropzone />
      </div>
      <div className="space-y-4">
        {filteredFiles.map(file => (
          <div key={file.id} onClick={() => onFileSelect(file)}>
            <FileCard file={file} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
