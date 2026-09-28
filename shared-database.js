const crypto = require('crypto');
const EncryptedArcadeDB = require('./database');

// Reuse account validation and stats logic without touching a function's /tmp.
class TransactionDatabase extends EncryptedArcadeDB {
  init() {}
  save() { this.dirty = true; return true; }
}

function createDatabaseService({ pool, local, serverless = false } = {}) {
  let schemaReady;
  const template = new TransactionDatabase();
  async function run(method, args) {
    if (!pool) {
      if (serverless) throw new Error('Shared database is not configured');
      local ||= new EncryptedArcadeDB();
      return method === 'countUsers' ? local.data.users.length : local[method](...args);
    }
    schemaReady ||= pool.query(`CREATE TABLE IF NOT EXISTS randoo_store (
      id INTEGER PRIMARY KEY CHECK (id = 1), payload BYTEA NOT NULL
    )`).catch(error => { schemaReady = null; throw error; });
    await schemaReady;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO randoo_store (id, payload) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [encode(template.data)]);
      // Serialize read/modify/write across every Vercel instance to avoid lost players.
      const { rows } = await client.query('SELECT payload FROM randoo_store WHERE id = 1 FOR UPDATE');
      const db = Object.create(TransactionDatabase.prototype);
      db.data = decode(rows[0].payload);
      const result = method === 'countUsers' ? db.data.users.length : db[method](...args);
      if (db.dirty) await client.query('UPDATE randoo_store SET payload = $1 WHERE id = 1', [encode(db.data)]);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
  function encode(data) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', template.masterKey, iv);
    const payload = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), payload]);
  }
  function decode(payload) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', template.masterKey, payload.subarray(0, 12));
    decipher.setAuthTag(payload.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8'));
  }
  return Object.fromEntries(['countUsers', 'register', 'login', 'validateSession', 'destroySession',
    'updateAvatar', 'syncUserStats', 'getLeaderboard'].map(method => [method, (...args) => run(method, args)]));
}

function configuredDatabase() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const pool = connectionString ? new (require('pg').Pool)({ connectionString, max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 }) : null;
  return createDatabaseService({ pool, serverless: !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) });
}

module.exports = { createDatabaseService, configuredDatabase };
