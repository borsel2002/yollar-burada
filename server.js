const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// File path for storing markers
const MARKERS_FILE = path.join(__dirname, 'markers.json');

// Initialize markers array
let markers = [];

// Load markers from file on startup
async function loadMarkers() {
  try {
    const data = await fs.readFile(MARKERS_FILE, 'utf8');
    markers = JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create it with empty array
      await fs.writeFile(MARKERS_FILE, '[]');
      markers = [];
    } else {
      console.error('Error loading markers:', error);
      markers = [];
    }
  }
}

// Save markers to file
async function saveMarkers() {
  try {
    await fs.writeFile(MARKERS_FILE, JSON.stringify(markers, null, 2));
    // Broadcast updated markers to all connected clients
    broadcastMarkers();
  } catch (error) {
    console.error('Error saving markers:', error);
  }
}

// Broadcast markers to all connected clients
function broadcastMarkers() {
  const message = JSON.stringify({ type: 'markers', data: markers });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Load markers when server starts
loadMarkers();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Send current markers to new client
  ws.send(JSON.stringify({ type: 'markers', data: markers }));
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Get all markers
app.get('/api/markers', (req, res) => {
  res.json(markers);
});

// Add a new marker
app.post('/api/markers', async (req, res) => {
  try {
    const marker = req.body;
    markers.push(marker);
    await saveMarkers();
    res.json(marker);
  } catch (error) {
    console.error('Error adding marker:', error);
    res.status(500).json({ error: 'Failed to add marker' });
  }
});

// Delete a marker
app.delete('/api/markers/:id', async (req, res) => {
  try {
    const markerId = req.params.id;
    markers = markers.filter(marker => marker.id !== markerId);
    await saveMarkers();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).json({ error: 'Failed to delete marker' });
  }
});

// Clear all markers
app.delete('/api/markers', async (req, res) => {
  try {
    markers = [];
    await saveMarkers();
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing markers:', error);
    res.status(500).json({ error: 'Failed to clear markers' });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 