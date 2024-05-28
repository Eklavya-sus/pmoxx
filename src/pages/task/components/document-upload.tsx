import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabaseClient } from '../../../utility';

const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    },
  });

  const uploadFiles = async () => {
    for (const file of files) {
      const { data, error } = await supabaseClient.storage
        .from('documents')
        .upload(`${file.name}`, file, { cacheControl: '3600', upsert: false });

      if (error) {
        console.error('Error uploading file:', error);
      } else {
        console.log('File uploaded:', data);
        // You can store the file path or URL in your database
        // to associate it with the current task or user
      }
    }
  };

  return (
    <div>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>
      <button onClick={uploadFiles} disabled={files.length === 0}>
        Upload Files
      </button>
    </div>
  );
};

export default DocumentUpload;