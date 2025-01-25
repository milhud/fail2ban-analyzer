import React, { useState } from 'react';
import axios from 'axios';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [graphUrl, setGraphUrl] = useState<string>('');
  const [counts, setCounts] = useState<number[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      setError('');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError('Please upload a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCounts(response.data.counts);
      setGraphUrl(response.data.graph_url);
    } catch (err) {
      setError('Error uploading file');
    }
  };

  return (
    <div>
      <h1>Fail2Ban Log Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {counts.length > 0 && (
        <div>
          <h2>Failed Login Counts</h2>
          <ul>
            {counts.map((count, index) => (
              <li key={index}>IP {index + 1}: {count}</li>
            ))}
          </ul>
        </div>
      )}
      {graphUrl && (
        <div>
          <h2>Login Failures per IP</h2>
          <img src={graphUrl} alt="Graph" />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
