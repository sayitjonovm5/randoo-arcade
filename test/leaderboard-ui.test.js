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
