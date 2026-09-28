/**
 * RANDOO ARCADE — BACKEND API SERVER WITH ENCRYPTED DATABASE & LEADERBOARD
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const EncryptedArcadeDB = require('./database');

const PORT = process.env.PORT || 8085;
const PUBLIC_DIR = __dirname;
const db = new EncryptedArcadeDB();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp'
};

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function getSessionToken(req) {
  // 1. From Cookie
  const cookies = parseCookies(req);
  if (cookies.randoo_session) return cookies.randoo_session;

  // 2. From Authorization Header
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB max payload protection
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data, headers = {}) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    ...headers
  });
  res.end(json);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }

  // ==========================================
  // API ENDPOINTS
  // ==========================================

  // 1. POST /api/register
  if (req.method === 'POST' && pathname === '/api/register') {
    try {
      const { username, email, password, allowCookies } = await parseJsonBody(req);
      const { user, token } = db.register(username, email, password);

      const headers = {};
      if (allowCookies) {
        headers['Set-Cookie'] = `randoo_session=${token}; Path=/; Max-Age=2592000; SameSite=Lax`;
      }

      return sendJson(res, 201, { ok: true, user, token }, headers);
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  // 2. POST /api/login
  if (req.method === 'POST' && pathname === '/api/login') {
    try {
      const { email, password, allowCookies } = await parseJsonBody(req);
      const { user, token } = db.login(email, password);

      const headers = {};
      if (allowCookies) {
        headers['Set-Cookie'] = `randoo_session=${token}; Path=/; Max-Age=2592000; SameSite=Lax`;
      }

      return sendJson(res, 200, { ok: true, user, token }, headers);
    } catch (err) {
      return sendJson(res, 401, { ok: false, error: err.message });
    }
  }

  // 3. POST /api/logout
  if (req.method === 'POST' && pathname === '/api/logout') {
    const token = getSessionToken(req);
    if (token) db.destroySession(token);
    return sendJson(res, 200, { ok: true }, {
      'Set-Cookie': 'randoo_session=; Path=/; Max-Age=0; SameSite=Lax'
    });
  }

  // 4. GET /api/me (Current Authenticated User)
  if (req.method === 'GET' && pathname === '/api/me') {
    const token = getSessionToken(req);
    const user = token ? db.validateSession(token) : null;
    return sendJson(res, 200, { ok: true, user });
  }

  // 5. POST /api/stats (Sync Player Stats to Encrypted Database)
  if (req.method === 'POST' && pathname === '/api/stats') {
    try {
      const token = getSessionToken(req);
      const user = token ? db.validateSession(token) : null;
      if (!user) {
        return sendJson(res, 200, { ok: false, message: 'Guest session — stats kept in local cache' });
      }

      const statsPayload = await parseJsonBody(req);
      const updatedUser = db.syncUserStats(user.id, statsPayload);
      return sendJson(res, 200, { ok: true, user: updatedUser });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  }

  // 6. GET /api/leaderboard (Public Leaderboard)
  if (req.method === 'GET' && pathname === '/api/leaderboard') {
    const sortBy = parsedUrl.query.sort || 'wins';
    const limit = parseInt(parsedUrl.query.limit, 10) || 25;
    const leaderboard = db.getLeaderboard(sortBy, limit);
    return sendJson(res, 200, { ok: true, sortBy, leaderboard });
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================
  let safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  // Default to index.html if path is directory
  if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
    safePath = path.join(safePath, 'index.html');
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(safePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found — Randoo Arcade');
  }
});

server.listen(PORT, () => {
  console.log(`[Randoo Arcade] Server with Encrypted Database running at http://localhost:${PORT}/`);
});
