(function (root) {
  const games = ['rps', 'ttt', 'guess', 'hangman'];
  function normalize(stats = {}) {
    const result = { totalPlayed: 0, totalWins: 0, games: {} };
    const count = value => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    for (const key of games) {
      const game = stats?.games?.[key] || {};
      const played = count(game.played);
      const wins = Math.min(played, count(game.wins));
      result.games[key] = { played, wins };
      result.totalPlayed += played;
      result.totalWins += wins;
    }
    return result;
  }
  const api = { games, normalize };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RankedStats = api;
})(typeof globalThis === 'object' ? globalThis : this);
