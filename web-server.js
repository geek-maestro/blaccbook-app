const express = require('express');
const path = require('path');
const fs = require('fs');

// Create an express app to handle the basic web page
const app = express();
const PORT = 5000;

// Log middleware to help with debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

// Fallback to index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BlaccBook info server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});