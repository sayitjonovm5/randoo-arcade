/**
 * RANDOO ARCADE — UNIFIED API ROUTER & HANDLER
 * Shared between standalone Node.js server (server.js) and Vercel Serverless Functions (api/index.js).
 */

const url = require('url');
const { configuredDatabase } = require('../shared-database');

// Singleton database instance
const db = configuredDatabase();

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
  const rc = req.headers && req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function getSessionToken(req) {
  // An explicit token takes priority over a stale cookie.
  const auth = req.headers && req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return parseCookies(req).randoo_session || null;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    // If body already parsed by serverless runtime
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return resolve(JSON.parse(req.body));
      } catch (e) {
        return reject(new Error('Invalid JSON format'));
      }
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2e6) { // 2MB limit for base64 avatar images
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
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    ...headers
  });
  res.end(json);
}

/**
 * Main API request dispatcher
 * Returns true if request was handled, false otherwise.
 */
async function dispatchApiRequest(req, res) {
  let parsedUrl;
  try {
    parsedUrl = url.parse(req.url, true);
  } catch (e) {
    parsedUrl = { pathname: req.url, query: {} };
  }

  const rawPath = decodeURIComponent(parsedUrl.pathname || '');

  // 1. Extract path from Vercel rewrite query parameter (e.g. ?path=leaderboard)
  let subRoute = '';
  if (parsedUrl.query && (parsedUrl.query.path || parsedUrl.query.route)) {
    subRoute = String(parsedUrl.query.path || parsedUrl.query.route).replace(/^\/+/, '');
  }

  // 2. Or from Vercel x-matched-path header
  const matchedHeader = req.headers && (req.headers['x-matched-path'] || req.headers['x-now-route-matches']);

  // Immediately check if this request is targeted at the API
  const isTargetingApi = subRoute.length > 0 ||
    rawPath.startsWith('/api/') ||
    rawPath === '/api' ||
    (matchedHeader && (matchedHeader.startsWith('/api/') || matchedHeader === '/api'));

  if (!isTargetingApi) {
    return false;
  }

  let apiPath = '';
  if (subRoute) {
    apiPath = '/api/' + subRoute;
  } else if (matchedHeader && !matchedHeader.includes('/api/index.js')) {
    apiPath = matchedHeader.split('?')[0];
  } else {
    apiPath = rawPath;
  }

  // Strip query string and index.js if present
  apiPath = apiPath.split('?')[0];
  if (apiPath.endsWith('/index.js')) {
    apiPath = apiPath.slice(0, -9);
  }

  // Normalize leading /api/ prefix
  if (!apiPath.startsWith('/api/') && apiPath !== '/api') {
    if (apiPath.startsWith('/')) {
      apiPath = '/api' + apiPath;
    } else {
      apiPath = '/api/' + apiPath;
    }
  }

  // Handle CORS Preflight for any API route
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    res.end();
    return true;
  }

  // 1. GET /api/health
  if (req.method === 'GET' && apiPath === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'Randoo Arcade API',
      status: 'healthy',
      time: new Date().toISOString(),
      registeredPlayers: await db.countUsers()
    }), true;
  }

  // 2. POST /api/register
  if (req.method === 'POST' && apiPath === '/api/register') {
    try {
      const { username, password, avatar, allowCookies } = await parseJsonBody(req);
      const { user, token } = await db.register(username, password, avatar);

      const headers = {};
      if (allowCookies) {
        headers['Set-Cookie'] = `randoo_session=${token}; Path=/; Max-Age=2592000; SameSite=Lax`;
      }

      sendJson(res, 201, { ok: true, user, token }, headers);
      return true;
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message });
      return true;
    }
  }

  // 3. POST /api/avatar (Upload / Update User Profile Photo)
  if (req.method === 'POST' && apiPath === '/api/avatar') {
    try {
      const token = getSessionToken(req);
      const user = token ? await db.validateSession(token) : null;
      if (!user) {
        sendJson(res, 401, { ok: false, error: 'Unauthorized. Please sign in.' });
        return true;
      }

      const { avatar } = await parseJsonBody(req);
      const updatedUser = await db.updateAvatar(user.id, avatar);
      sendJson(res, 200, { ok: true, user: updatedUser });
      return true;
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err.message });
      return true;
    }
  }

  // 4. POST /api/login
  if (req.method === 'POST' && apiPath === '/api/login') {
    try {
      const { username, email, password, allowCookies } = await parseJsonBody(req);
      const loginIdentifier = username || email;
      const { user, token } = await db.login(loginIdentifier, password);

      const headers = {};
      if (allowCookies) {
        headers['Set-Cookie'] = `randoo_session=${token}; Path=/; Max-Age=2592000; SameSite=Lax`;
      }

      sendJson(res, 200, { ok: true, user, token }, headers);
      return true;
    } catch (err) {
      sendJson(res, 401, { ok: false, error: err.message });
      return true;
    }
  }

  // 5. POST /api/logout
  if (req.method === 'POST' && apiPath === '/api/logout') {
    const token = getSessionToken(req);
    if (token) await db.destroySession(token);
    sendJson(res, 200, { ok: true }, {
      'Set-Cookie': 'randoo_session=; Path=/; Max-Age=0; SameSite=Lax'
    });
    return true;
  }

  // 6. GET /api/me (Current Authenticated User)
  if (req.method === 'GET' && apiPath === '/api/me') {
    const token = getSessionToken(req);
    const user = token ? await db.validateSession(token) : null;
    sendJson(res, 200, { ok: true, user });
    return true;
  }

  // 7. POST /api/stats (Sync Player Stats to Encrypted Database)
  if (req.method === 'POST' && apiPath === '/api/stats') {
    try {
      const token = getSessionToken(req);
      const user = token ? await db.validateSession(token) : null;
      if (!user) {
        sendJson(res, 200, { ok: false, message: 'Guest session — stats kept in local cache' });
        return true;
      }

      const statsPayload = await parseJsonBody(req);
      const updatedUser = await db.syncUserStats(user.id, statsPayload);
      sendJson(res, 200, { ok: true, user: updatedUser });
      return true;
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err.message });
      return true;
    }
  }

  // 8. GET /api/leaderboard (Public Leaderboard)
  if (req.method === 'GET' && apiPath === '/api/leaderboard') {
    const sortBy = (parsedUrl.query && parsedUrl.query.sort) || 'wins';
    const limit = parseInt(parsedUrl.query && parsedUrl.query.limit, 10) || 25;
    const leaderboard = await db.getLeaderboard(sortBy, limit);
    sendJson(res, 200, { ok: true, sortBy, leaderboard });
    return true;
  }

  // Unknown API route
  sendJson(res, 404, { ok: false, error: `API route ${apiPath} not found` });
  return true;
}

async function handleApiRequest(req, res) {
  try { return await dispatchApiRequest(req, res); }
  catch (error) {
    sendJson(res, 503, { ok: false, error: 'Account service unavailable. Please try again later.' });
    return true;
  }
}

module.exports = {
  db,
  MIME_TYPES,
  handleApiRequest,
  parseCookies,
  getSessionToken,
  parseJsonBody,
  sendJson
};
