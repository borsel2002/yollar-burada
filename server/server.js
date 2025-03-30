const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Store markers in memory (in a real app, this would be in a database)
const markers = new Map();

// HTTP endpoints
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Get all markers
app.get('/api/markers', (req, res) => {
  console.log('Getting all markers');
  res.json(Array.from(markers.values()));
});

// Add a new marker
app.post('/api/markers', (req, res) => {
  try {
    console.log('Adding new marker:', req.body);
    const marker = req.body;
    markers.set(marker.id, marker);
    res.json(marker);
  } catch (error) {
    console.error('Error adding marker:', error);
    res.status(500).json({ error: 'Failed to add marker' });
  }
});

// Remove a marker
app.delete('/api/markers/:id', (req, res) => {
  try {
    console.log('Removing marker:', req.params.id);
    const markerId = req.params.id;
    markers.delete(markerId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing marker:', error);
    res.status(500).json({ error: 'Failed to remove marker' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
