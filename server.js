const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// In-memory storage for markers (in a real app, you'd use a database)
let markers = [];

app.use(cors());
app.use(express.json());

// Get all markers
app.get('/api/markers', (req, res) => {
  res.json(markers);
});

// Add a new marker
app.post('/api/markers', (req, res) => {
  const marker = req.body;
  markers.push(marker);
  res.json(marker);
});

// Remove a marker
app.delete('/api/markers/:id', (req, res) => {
  const markerId = req.params.id;
  markers = markers.filter(marker => marker.id !== markerId);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 