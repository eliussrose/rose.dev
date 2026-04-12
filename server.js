/**
 * Simple HTTP server for serving Next.js build in Electron
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');

const PORT = 3000;
const HOSTNAME = '127.0.0.1';

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Remove leading slash
  if (pathname === '/') pathname = '/index.html';

  // Security: prevent directory traversal
  if (pathname.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Try to serve from .next/static first
  if (pathname.startsWith('/_next/static/')) {
    const staticPath = path.join(__dirname, '.next', 'static', pathname.replace('/_next/static/', ''));
    if (fs.existsSync(staticPath)) {
      serveFile(res, staticPath);
      return;
    }
  }

  // Try to serve from public
  if (pathname.startsWith('/')) {
    const publicPath = path.join(__dirname, 'public', pathname);
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
      serveFile(res, publicPath);
      return;
    }
  }

  // API routes - proxy to Next.js standalone server
  if (pathname.startsWith('/api/')) {
    res.writeHead(501, { 'Content-Type': 'text/plain' });
    res.end('API routes not implemented in static mode');
    return;
  }

  // Serve index.html for all other routes (SPA fallback)
  const indexPath = path.join(__dirname, '.next', 'server', 'app', 'index.html');
  if (fs.existsSync(indexPath)) {
    serveFile(res, indexPath);
  } else {
    // Fallback to root index
    const rootIndex = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(rootIndex)) {
      serveFile(res, rootIndex);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`[Server] Running at http://${HOSTNAME}:${PORT}/`);
});

// Handle errors
server.on('error', (err) => {
  console.error('[Server] Error:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down...');
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});
