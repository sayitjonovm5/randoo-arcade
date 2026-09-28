const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(apiFetch) {
  const source = fs.readFileSync(require.resolve('../frontend/script.js'), 'utf8');
  const start = source.indexOf('  let leaderboardRequest = 0;');
  const end = source.indexOf('  function renderLeaderboardRows', start);
  const element = () => ({ innerHTML: '', textContent: '', classList: { add() {}, remove() {} } });
  const rendered = [];
  const context = {
    window: { location: { protocol: 'https:' } }, apiFetch,
    vault: { getLeaderboard() { throw new Error('Private rankings must never be used online'); } },
    activeLbSort: 'wins', leaderboardBody: element(), leaderboardLoading: element(), leaderboardEmpty: element(),
    renderLeaderboardRows: rows => rendered.push(rows)
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);
  return { context, rendered };
}

test('empty server rankings replace existing rows without a private fallback', async () => {
  const { context, rendered } = setup(async () => ({ ok: true, leaderboard: [] }));
  await context.fetchLeaderboard();
  assert.equal(rendered.length, 1);
  assert.equal(rendered[0].length, 0);
});

test('out-of-order refreshes cannot replace the newest leaderboard', async () => {
  const requests = [];
  const { context, rendered } = setup(() => new Promise(resolve => requests.push(resolve)));
  const first = context.fetchLeaderboard('wins');
  const second = context.fetchLeaderboard('played');
  requests[1]({ ok: true, leaderboard: [{ username: 'Alice' }, { username: 'Bob' }] });
  await second;
  requests[0]({ ok: true, leaderboard: [{ username: 'Old result' }] });
  await first;
  assert.equal(rendered.length, 1);
  assert.equal(rendered[0].length, 2);
});

test('failed online requests show unavailable rather than browser-only rankings', async () => {
  const { context, rendered } = setup(async () => { throw new Error('Offline'); });
  await context.fetchLeaderboard();
  assert.equal(rendered.length, 0);
  assert.match(context.leaderboardLoading.textContent, /unavailable/);
});

test('ranks 1, 2, and 3 display cup emojis without numbers, and rank 4+ displays #rank', () => {
  const source = fs.readFileSync(require.resolve('../frontend/script.js'), 'utf8');
  const start = source.indexOf('  function renderLeaderboardRows');
  const end = source.indexOf('  function escapeHtml', start);
  const element = () => ({ innerHTML: '', textContent: '', classList: { add() {}, remove() {} } });
  const leaderboardBody = element();
  const context = {
    currentUser: null,
    leaderboardBody,
    leaderboardLoading: element(),
    leaderboardEmpty: element(),
    escapeHtml: s => s
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end), context);

  context.renderLeaderboardRows([
    { rank: 1, username: 'PlayerOne', totalWins: 10, totalPlayed: 12, winRate: 83 },
    { rank: 2, username: 'PlayerTwo', totalWins: 8, totalPlayed: 10, winRate: 80 },
    { rank: 3, username: 'PlayerThree', totalWins: 5, totalPlayed: 8, winRate: 63 },
    { rank: 4, username: 'PlayerFour', totalWins: 3, totalPlayed: 6, winRate: 50 }
  ]);

  const html = leaderboardBody.innerHTML;
  // Rank 1: gold badge with 🥇 and no "1" inside badge
  assert.match(html, /<span class="rank-badge rank-gold"[^>]*>🥇<\/span>/);
  // Rank 2: silver badge with 🥈 and no "2" inside badge
  assert.match(html, /<span class="rank-badge rank-silver"[^>]*>🥈<\/span>/);
  // Rank 3: bronze badge with 🥉 and no "3" inside badge
  assert.match(html, /<span class="rank-badge rank-bronze"[^>]*>🥉<\/span>/);
  // Rank 4: standard #4
  assert.match(html, /<span class="rank-standard">#4<\/span>/);
});
