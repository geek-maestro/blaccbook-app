const { exec } = require('child_process');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');

// Start the Expo development server
const expoProcess = exec('npx expo start --web', (error, stdout, stderr) => {
  if (error) {
    console.error(`Exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});

// Create an express app to handle proxying
const app = express();

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

// Wait for the Expo server to start before setting up the proxy
setTimeout(() => {
  // Forward all other requests to the Expo development server
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:19006', // Expo's default port
    changeOrigin: true,
    ws: true,
  }));

  // Start the proxy server on port 5000
  const server = app.listen(5000, '0.0.0.0', () => {
    console.log('Proxy server is running on port 5000');
  });
}, 10000); // Wait 10 seconds for Expo to start

// Handle termination
process.on('SIGINT', () => {
  expoProcess.kill();
  process.exit();
});