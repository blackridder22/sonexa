import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const ImportDropzone: React.FC = () => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filePaths = acceptedFiles.map((file) => (file as any).path);
    window.sonexa.importFiles(filePaths).then((importedFiles) => {
      console.log('Imported files:', importedFiles);
      // Here you can add a toast notification
      document.dispatchEvent(new CustomEvent('files-imported'));
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className={`w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-400'}`}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
    </div>
  );
};

export default ImportDropzone;
