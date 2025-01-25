import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [file, setFile] = useState<File | null>(null);
  const [graphUrl, setGraphUrl] = useState<string | null>(null);
  const [ipCounts, setIpCounts] = useState<{ [key: string]: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setIpCounts(response.data.counts);
      setGraphUrl(`http://localhost:5000/graphs/graph.png`);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>Fail2Ban Log Analyzer</h1>
        <p>
          Analyze Fail2Ban log files to detect failed login attempts and visualize them in an interactive graph.
        </p>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Left Column: Instructions and Form */}
        <div className="left-column">
          <section className="instructions">
            <h2>How It Works</h2>
            <p>
              This tool processes your Fail2Ban log files to identify failed login attempts, 
              showing which IPs are causing the issues. Follow these steps:
            </p>
            <ol>
              <li>Upload your Fail2Ban log file.</li>
              <li>View the list of IPs and their failed attempt counts.</li>
              <li>See a graph visualization of the data.</li>
            </ol>
          </section>

          <section className="upload-section">
            <form onSubmit={handleSubmit} className="upload-form">
              <label className="file-label" htmlFor="file-input">
                Choose a log file:
              </label>
              <input
                type="file"
                id="file-input"
                onChange={handleFileChange}
                className="file-input"
              />
              <button
                type="submit"
                disabled={loading}
                className={`submit-btn ${loading ? 'disabled' : ''}`}
              >
                {loading ? 'Processing...' : 'Upload'}
              </button>
            </form>
          </section>

          {ipCounts && (
            <section className="ip-counts">
              <h3>Failed Login Attempts by IP</h3>
              <div className="ip-list">
                {Object.entries(ipCounts).map(([ip, count]) => (
                  <div key={ip} className="ip-item">
                    <span>{ip}</span>
                    <span>{count} attempts</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Graph */}
        <div className="right-column">
          {graphUrl ? (
            <>
              <h2>Graph Visualization</h2>
              <img src={graphUrl} alt="Graph of failed login attempts" className="graph" />
            </>
          ) : (
            <p className="no-graph">Upload a file to see the graph.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
