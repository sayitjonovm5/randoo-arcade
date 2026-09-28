const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('API keeps both players and prefers explicit sessions over stale cookies', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'randoo-api-'));
  process.env.DB_FILE_PATH = path.join(directory, 'test.enc');
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.VERCEL;
  delete process.env.AWS_LAMBDA_FUNCTION_NAME;
  const server = require('../server');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function post(route, body, headers = {}) {
    return fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  }
  try {
    const aliceResponse = await post('/api/register', { username: 'Alice', password: 'password-1' });
    assert.equal(aliceResponse.status, 201);
    const alice = await aliceResponse.json();
    const bob = await (await post('/api/register', { username: 'Bob', password: 'password-2' })).json();
    await post('/api/stats', { games: { guess: { played: 3, wins: 2 }, dice: { played: 900, wins: 900 } } },
      { Authorization: `Bearer ${alice.token}`, Cookie: `randoo_session=${bob.token}` });
    for (let i = 0; i < 3; i++) {
      const response = await fetch(base + '/api/leaderboard');
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const { leaderboard } = await response.json();
      assert.deepEqual(leaderboard.map(p => [p.username, p.totalWins]), [['Alice', 2], ['Bob', 0]]);
    }
    assert.equal((await post('/api/login', { username: 'Alice', password: 'wrong-password' })).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.unlinkSync(process.env.DB_FILE_PATH);
    fs.rmdirSync(directory);
  }
});
