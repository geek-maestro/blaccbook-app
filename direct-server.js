const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Get the HTML content
  fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, content) => {
    if (err) {
      // If index.html isn't found, create a basic HTML response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>BlaccBook App</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: system-ui, sans-serif;
                background-color: #000;
                color: #fff;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
              }
              h1 {
                font-size: 2rem;
                margin-bottom: 1rem;
              }
              p {
                font-size: 1.2rem;
                max-width: 600px;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div>
              <h1>BlaccBook App</h1>
              <p>
                A React Native mobile chat application designed for seamless communication
                and booking platform integration. The app leverages Firebase for backend services,
                providing real-time messaging, notifications, and user-friendly mobile experiences.
              </p>
            </div>
          </body>
        </html>
      `);
    } else {
      // Serve the index.html file
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    }
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`BlaccBook info server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});