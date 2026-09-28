/**
 * RANDOO ARCADE — BACKEND API SERVER WITH ENCRYPTED DATABASE & LEADERBOARD
 * Handles local development and production deployments (VPS, Docker, Railway, Render).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApiRequest, MIME_TYPES } = require('./api/handler');

const PORT = parseInt(process.env.PORT, 10) || 8085;
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'frontend'))
  ? path.join(__dirname, 'frontend')
  : __dirname;

const server = http.createServer(async (req, res) => {
  // 1. Dispatch API Requests
  const handled = await handleApiRequest(req, res);
  if (handled) return;

  // 2. Static File Serving from PUBLIC_DIR (frontend/)
  let pathname = '';
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  } catch (e) {
    pathname = req.url.split('?')[0];
  }

  let safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  // Default to index.html if target is a directory
  if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
    safePath = path.join(safePath, 'index.html');
  }

  // Serve static file
  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    fs.createReadStream(safePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found — Randoo Arcade');
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Randoo Arcade] Server running at http://localhost:${PORT}/`);
    console.log(`[Randoo Arcade] Static frontend served from: ${PUBLIC_DIR}`);
    console.log(`[Randoo Arcade] API endpoints active at: http://localhost:${PORT}/api/*`);
  });
}

module.exports = server;
