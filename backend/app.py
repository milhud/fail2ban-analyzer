from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from werkzeug.utils import secure_filename
import logging

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for the entire app or specific routes
CORS(app, resources={r"/graphs/*": {"origins": "*"}})  # Allow CORS for the /graphs route

# Set up logging configuration
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('app')

# Directory for storing uploaded files and graphs
UPLOAD_FOLDER = 'uploads'
GRAPH_FOLDER = 'graphs'

# Ensure the upload and graph folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GRAPH_FOLDER, exist_ok=True)

# Set the file size limit
app.config['MAX_CONTENT_LENGTH'] = 16777216  # 16MB

@app.route('/')
def home():
    return 'Fail2Ban Log Analyzer API'

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        logger.error("No file part in request")
        return jsonify({'error': 'No file part in request'}), 400

    file = request.files['file']
    
    if file.filename == '':
        logger.error("No file selected")
        return jsonify({'error': 'No file selected'}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    
    logger.debug(f"File saved to {file_path}")
    
    try:
        ip_counts = process_log_file(file_path)
        graph_url = generate_graph(ip_counts)
        return jsonify({'counts': ip_counts, 'graph_url': graph_url})

    except Exception as e:
        logger.error(f"Error processing file: {e}")
        return jsonify({'error': 'Error processing the file'}), 500

def process_log_file(file_path):
    ip_counts = {}
    with open(file_path, 'r') as file:
        for line in file:
            if 'fail2ban.actions' in line and 'Ban' in line:
                parts = line.split()
                ip_address = parts[-1]
                if ip_address in ip_counts:
                    ip_counts[ip_address] += 1
                else:
                    ip_counts[ip_address] = 1
    return ip_counts

def generate_graph(ip_counts):
    if not ip_counts:
        return ''

    ips = list(ip_counts.keys())
    counts = list(ip_counts.values())

    plt.figure(figsize=(10, 6))
    plt.bar(ips, counts, color='skyblue')
    plt.xlabel('IP Address')
    plt.ylabel('Failed Login Attempts')
    plt.title('Failed Login Attempts by IP')
    plt.xticks(rotation=45, ha='right')

    graph_filename = 'graph.png'
    graph_path = os.path.join(GRAPH_FOLDER, graph_filename)
    plt.tight_layout()
    plt.savefig(graph_path)
    plt.close()
    
    logger.debug(f"Graph saved to {graph_path}")
    
    return f'/graphs/{graph_filename}'

@app.route('/graphs/<filename>')
def serve_graph(filename):
    return send_from_directory(GRAPH_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
