import React, { useState, useEffect } from 'react';
import FileCard from './FileCard';
import ImportDropzone from './ImportDropzone';

interface FileListProps {
  activeTab: string;
}

const FileList: React.FC<FileListProps> = ({ activeTab }) => {
  const [files, setFiles] = useState<any[]>([]);

  useEffect(() => {
    window.sonexa.listFiles().then((files) => {
      setFiles(files);
    });
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
          <FileCard key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
};

export default FileList;
