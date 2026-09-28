const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { createDatabaseService } = require('../shared-database');
const { normalize } = require('../frontend/ranked-stats');

test('ranked statistics exclude historical dice and reaction scores', () => {
  assert.deepEqual(normalize({ totalPlayed: 999, totalWins: 999, bestReactionMs: 100,
    games: { rps: { played: 5, wins: 3 }, dice: { played: 900, wins: 900 }, rtt: { played: 94 } }
  }), { totalPlayed: 5, totalWins: 3, games: {
    rps: { played: 5, wins: 3 }, ttt: { played: 0, wins: 0 },
    guess: { played: 0, wins: 0 }, hangman: { played: 0, wins: 0 }
  } });
});

test('serverless cannot silently use a private temporary database', async () => {
  const db = createDatabaseService({ serverless: true });
  await assert.rejects(db.getLeaderboard(), /Shared database is not configured/);
});

test('independent instances share accounts, sessions and rankings without lost writes', async () => {
  const engine = new PGlite();
  // PGlite is single-connection PostgreSQL; queue transactions like pool clients.
  let tail = Promise.resolve();
  async function acquire() {
    const previous = tail;
    let release;
    tail = new Promise(resolve => { release = resolve; });
    await previous;
    return { query: (sql, args) => engine.query(sql, args), release };
  }
  const pool = {
    connect: acquire,
    async query(sql, args) {
      const client = await acquire();
      try { return await client.query(sql, args); } finally { client.release(); }
    }
  };
  try {
    const a = createDatabaseService({ pool });
    const b = createDatabaseService({ pool });
    const [alice, bob] = await Promise.all([
      a.register('Alice', 'password-1'), b.register('Bob', 'password-2')
    ]);
    assert.equal((await b.validateSession(alice.token)).username, 'Alice');
    await Promise.all([
      a.syncUserStats(alice.user.id, { totalWins: 1000, games: { rps: { played: 5, wins: 3 }, dice: { played: 999, wins: 999 } } }),
      b.syncUserStats(bob.user.id, { games: { hangman: { played: 6, wins: 4 }, rtt: { played: 100 } } })
    ]);
    for (const instance of [a, b, createDatabaseService({ pool })]) {
      const list = await instance.getLeaderboard();
      assert.deepEqual(list.map(p => [p.username, p.totalPlayed, p.totalWins]), [['Bob', 6, 4], ['Alice', 5, 3]]);
      assert.equal(list[0].bestReactionMs, undefined);
    }
    await assert.rejects(a.register('alice', 'password-3'), /already taken/);
    assert.equal(await b.countUsers(), 2);
    assert.equal((await b.login('Alice', 'password-1')).user.id, alice.user.id);
    await a.destroySession(alice.token);
    assert.equal(await b.validateSession(alice.token), null);
    const { rows } = await pool.query('SELECT payload FROM randoo_store WHERE id = 1');
    assert.equal(Buffer.from(rows[0].payload).includes(Buffer.from('Alice')), false);
  } finally { await engine.close(); }
});
