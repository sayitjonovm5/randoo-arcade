/**
 * RANDOO ARCADE HUB - CONTROLLER, THEME ENGINE & ANIMATED CANVAS BACKGROUND
 */

// Sound Synthesizer Engine
class ArcadeAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('randoo_sound_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('randoo_sound_muted', this.isMuted ? 'true' : 'false');
    return this.isMuted;
  }

  playPop() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }
}

// Animated Arcade Canvas Background
class ArcadeBackgroundEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    this.initParticles();
    this.start();
  }

  setTheme(isDark) {
    this.isDark = isDark;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initParticles(count = 45) {
    this.particles = [];
    const shapes = ['diamond', 'plus', 'circle', 'square'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 8 + 6,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 1.5,
        alpha: Math.random() * 0.35 + 0.15
      });
    }
  }

  start() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const darkColors = ['#00f2fe', '#4facfe', '#9d4edd', '#00e676', '#ff007f'];
    const lightColors = ['#0284c7', '#2563eb', '#7c3aed', '#10b981', '#e11d48'];
    const colors = this.isDark ? darkColors : lightColors;

    this.particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;

      // Mouse gentle repulsion
      const dx = p.x - this.mouseX;
      const dy = p.y - this.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        p.x += (dx / dist) * 1.5;
        p.y += (dy / dist) * 1.5;
      }

      // Screen wrapping
      if (p.x < -20) p.x = this.canvas.width + 20;
      if (p.x > this.canvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = this.canvas.height + 20;
      if (p.y > this.canvas.height + 20) p.y = -20;

      const color = colors[idx % colors.length];

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.alpha;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.8;

      if (p.shape === 'diamond') {
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size);
        this.ctx.lineTo(p.size, 0);
        this.ctx.lineTo(0, p.size);
        this.ctx.lineTo(-p.size, 0);
        this.ctx.closePath();
        this.ctx.stroke();
      } else if (p.shape === 'plus') {
        const arm = p.size * 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(-arm, 0);
        this.ctx.lineTo(arm, 0);
        this.ctx.moveTo(0, -arm);
        this.ctx.lineTo(0, arm);
        this.ctx.stroke();
      } else if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        // square
        this.ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      this.ctx.restore();
    });
  }
}

// Global Stats Store
const STATS_KEY = 'randoo_arcade_profile';

function getArcadeProfile() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    totalPlayed: 0,
    totalWins: 0,
    bestReactionMs: null,
    games: {
      rps: { played: 0, wins: 0 },
      ttt: { played: 0, wins: 0 },
      guess: { played: 0, wins: 0 },
      dice: { played: 0, wins: 0 },
      hangman: { played: 0, wins: 0 },
      rtt: { played: 0, bestMs: null }
    }
  };
}

// ==========================================
// CLIENT ENCRYPTED DATABASE VAULT (HYBRID ARCHITECTURE)
// Works seamlessly on Node server, Live Server, file://, Netlify, and Vercel
// ==========================================
class ClientEncryptedVault {
  constructor() {
    this.storageKey = 'randoo_encrypted_vault';
    this.sessionKey = 'randoo_active_session';
    this.secret = 'randoo_arcade_master_vault_key_2026';
    this.init();
  }

  hashPassword(password, salt) {
    let hash = 0x811c9dc5;
    const combined = salt + ':' + password + ':randoo_entropy_token';
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const part1 = ('0000000' + (hash >>> 0).toString(16)).slice(-8);
    const part2 = ('0000000' + (Math.imul(hash, 0x5bd1e995) >>> 0).toString(16)).slice(-8);
    const part3 = ('0000000' + (Math.imul(hash, 0x27d4eb2f) >>> 0).toString(16)).slice(-8);
    const part4 = ('0000000' + (Math.imul(hash, 0x165667b1) >>> 0).toString(16)).slice(-8);
    return part1 + part2 + part3 + part4;
  }

  encrypt(data) {
    try {
      const json = JSON.stringify(data);
      const iv = Math.random().toString(36).slice(2, 10);
      let hex = '';
      for (let i = 0; i < json.length; i++) {
        const k = this.secret.charCodeAt(i % this.secret.length) ^ iv.charCodeAt(i % iv.length);
        const c = json.charCodeAt(i) ^ k;
        hex += ('00' + c.toString(16)).slice(-2);
      }
      return iv + ':' + hex;
    } catch (e) {
      return null;
    }
  }

  decrypt(ciphertext) {
    try {
      if (!ciphertext || !ciphertext.includes(':')) return null;
      const [iv, hex] = ciphertext.split(':');
      let json = '';
      for (let i = 0; i < hex.length; i += 2) {
        const c = parseInt(hex.substr(i, 2), 16);
        const k = this.secret.charCodeAt((i / 2) % this.secret.length) ^ iv.charCodeAt((i / 2) % iv.length);
        json += String.fromCharCode(c ^ k);
      }
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = this.decrypt(raw);
        if (data && data.users) return data;
      }
    } catch (e) {}
    return this.seedInitial();
  }

  save(data) {
    try {
      const enc = this.encrypt(data);
      if (enc) localStorage.setItem(this.storageKey, enc);
    } catch (e) {}
  }

  seedInitial() {
    const initial = {
      users: {
        'neo@arcade.net': {
          id: 'champ_1',
          username: 'NeoGamer',
          email: 'neo@arcade.net',
          passwordHash: this.hashPassword('NeoPass123!', 'salt_1'),
          salt: 'salt_1',
          stats: { totalWins: 48, totalPlayed: 62, bestReactionMs: 194, games: { rps: { played: 25, wins: 20 }, rtt: { played: 15, bestMs: 194 } } }
        },
        'cyber@arcade.net': {
          id: 'champ_2',
          username: 'CyberPixel',
          email: 'cyber@arcade.net',
          passwordHash: this.hashPassword('CyberPass123!', 'salt_2'),
          salt: 'salt_2',
          stats: { totalWins: 39, totalPlayed: 55, bestReactionMs: 215, games: { ttt: { played: 20, wins: 15 }, rtt: { played: 10, bestMs: 215 } } }
        },
        'ninja@arcade.net': {
          id: 'champ_3',
          username: 'PixelNinja',
          email: 'ninja@arcade.net',
          passwordHash: this.hashPassword('NinjaPass123!', 'salt_3'),
          salt: 'salt_3',
          stats: { totalWins: 31, totalPlayed: 42, bestReactionMs: 240, games: { guess: { played: 18, wins: 12 }, rtt: { played: 8, bestMs: 240 } } }
        },
        'speed@arcade.net': {
          id: 'champ_4',
          username: 'QuantumSpeed',
          email: 'speed@arcade.net',
          passwordHash: this.hashPassword('SpeedPass123!', 'salt_4'),
          salt: 'salt_4',
          stats: { totalWins: 26, totalPlayed: 35, bestReactionMs: 178, games: { rtt: { played: 20, bestMs: 178 } } }
        },
        'viper@arcade.net': {
          id: 'champ_5',
          username: 'RetroViper',
          email: 'viper@arcade.net',
          passwordHash: this.hashPassword('ViperPass123!', 'salt_5'),
          salt: 'salt_5',
          stats: { totalWins: 19, totalPlayed: 30, bestReactionMs: 265, games: { dice: { played: 14, wins: 9 }, rtt: { played: 5, bestMs: 265 } } }
        }
      }
    };
    this.save(initial);
    return initial;
  }

  init() {
    this.load();
  }

  register(username, email, password) {
    const data = this.load();
    const normEmail = email.toLowerCase().trim();
    const normUser = username.trim();

    if (data.users[normEmail]) {
      throw new Error('An account with this email address already exists.');
    }
    for (const u of Object.values(data.users)) {
      if (u.username.toLowerCase() === normUser.toLowerCase()) {
        throw new Error('This username is already taken. Please choose another.');
      }
    }

    const salt = Math.random().toString(36).slice(2, 10);
    const passwordHash = this.hashPassword(password, salt);
    const user = {
      id: 'user_' + Math.random().toString(36).slice(2, 12),
      username: normUser,
      email: normEmail,
      passwordHash,
      salt,
      stats: {
        totalPlayed: 0,
        totalWins: 0,
        bestReactionMs: null,
        games: {}
      },
      createdAt: new Date().toISOString()
    };

    data.users[normEmail] = user;
    this.save(data);

    const token = 'token_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    return { user: this.sanitize(user), token };
  }

  login(email, password) {
    const data = this.load();
    const normEmail = email.toLowerCase().trim();
    const user = data.users[normEmail];
    if (!user) {
      throw new Error('No account found with this email. Please check your spelling or register.');
    }

    const hash = this.hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    const token = 'token_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    return { user: this.sanitize(user), token };
  }

  syncUserStats(userId, newStats) {
    if (!userId || !newStats) return null;
    const data = this.load();
    for (const u of Object.values(data.users)) {
      if (u.id === userId) {
        u.stats.totalPlayed = Math.max(u.stats.totalPlayed || 0, newStats.totalPlayed || 0);
        u.stats.totalWins = Math.max(u.stats.totalWins || 0, newStats.totalWins || 0);
        if (newStats.bestReactionMs) {
          if (!u.stats.bestReactionMs || newStats.bestReactionMs < u.stats.bestReactionMs) {
            u.stats.bestReactionMs = newStats.bestReactionMs;
          }
        }
        if (newStats.games) {
          u.stats.games = u.stats.games || {};
          for (const [k, v] of Object.entries(newStats.games)) {
            if (!u.stats.games[k]) {
              u.stats.games[k] = { played: v.played || 0, wins: v.wins || 0, bestMs: v.bestMs || null };
            } else {
              u.stats.games[k].played = Math.max(u.stats.games[k].played || 0, v.played || 0);
              u.stats.games[k].wins = Math.max(u.stats.games[k].wins || 0, v.wins || 0);
              if (v.bestMs) {
                u.stats.games[k].bestMs = u.stats.games[k].bestMs ? Math.min(u.stats.games[k].bestMs, v.bestMs) : v.bestMs;
              }
            }
          }
        }
        this.save(data);
        return this.sanitize(u);
      }
    }
    return null;
  }

  getLeaderboard(sortBy = 'wins', limit = 25) {
    const data = this.load();
    const list = Object.values(data.users).map(u => {
      const played = u.stats?.totalPlayed || 0;
      const wins = u.stats?.totalWins || 0;
      const rate = played > 0 ? Math.round((wins / played) * 100) : 0;
      return {
        id: u.id,
        username: u.username,
        totalWins: wins,
        totalPlayed: played,
        bestReactionMs: u.stats?.bestReactionMs || null,
        winRate: rate
      };
    });

    if (sortBy === 'reaction') {
      list.sort((a, b) => {
        if (a.bestReactionMs === null && b.bestReactionMs === null) return b.totalWins - a.totalWins;
        if (a.bestReactionMs === null) return 1;
        if (b.bestReactionMs === null) return -1;
        return a.bestReactionMs - b.bestReactionMs;
      });
    } else if (sortBy === 'played') {
      list.sort((a, b) => {
        if (b.totalPlayed !== a.totalPlayed) return b.totalPlayed - a.totalPlayed;
        return b.totalWins - a.totalWins;
      });
    } else {
      list.sort((a, b) => {
        if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
        return b.winRate - a.winRate;
      });
    }

    return list.slice(0, limit).map((p, i) => ({ rank: i + 1, ...p }));
  }

  saveSession(user, token, allowCookies) {
    const sessionObj = { user, token };
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionObj));
      sessionStorage.setItem('randoo_session_token', token);
      if (allowCookies) {
        document.cookie = `randoo_session=${token}; Path=/; Max-Age=2592000; SameSite=Lax`;
      }
    } catch (e) {}
  }

  restoreSession() {
    const raw = localStorage.getItem(this.sessionKey);
    if (raw) {
      try {
        const sess = JSON.parse(raw);
        if (sess && sess.user) {
          const data = this.load();
          for (const u of Object.values(data.users)) {
            if (u.id === sess.user.id) return this.sanitize(u);
          }
          return sess.user;
        }
      } catch (e) {}
    }
    return null;
  }

  clearSession() {
    try {
      localStorage.removeItem(this.sessionKey);
      sessionStorage.removeItem('randoo_session_token');
      document.cookie = 'randoo_session=; Path=/; Max-Age=0; SameSite=Lax';
    } catch (e) {}
  }

  sanitize(user) {
    const copy = { ...user };
    delete copy.passwordHash;
    delete copy.salt;
    return copy;
  }
}

// Main Hub Controller
document.addEventListener('DOMContentLoaded', () => {
  const audio = new ArcadeAudio();
  const vault = new ClientEncryptedVault();

  // State
  let currentUser = null;
  let activeLbSort = 'wins';
  let authMode = 'login';
  let currentTheme = localStorage.getItem('randoo_theme') || 'dark';

  // Header & Theme Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const resetStatsBtn = document.getElementById('resetStatsBtn');

  // User Auth Elements
  const guestAuthActions = document.getElementById('guestAuthActions');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const authBtn = document.getElementById('authBtn');
  const authBtnText = document.getElementById('authBtnText');
  const userDropdown = document.getElementById('userDropdown');
  const dropdownUsername = document.getElementById('dropdownUsername');
  const dropdownEmail = document.getElementById('dropdownEmail');
  const dropStatWins = document.getElementById('dropStatWins');
  const dropStatPlayed = document.getElementById('dropStatPlayed');
  const dropStatReflex = document.getElementById('dropStatReflex');
  const logoutBtn = document.getElementById('logoutBtn');

  // Stats Display Elements
  const statTotalPlayed = document.getElementById('statTotalPlayed');
  const statTotalWins = document.getElementById('statTotalWins');
  const statBestReaction = document.getElementById('statBestReaction');
  const statFavoriteGame = document.getElementById('statFavoriteGame');
  const statCardRPS = document.querySelector('#statCardRPS span');
  const statCardTTT = document.querySelector('#statCardTTT span');
  const statCardGuess = document.querySelector('#statCardGuess span');
  const statCardDice = document.querySelector('#statCardDice span');
  const statCardHangman = document.querySelector('#statCardHangman span');
  const statCardRTT = document.querySelector('#statCardRTT span');

  // Filter & Search
  const filterTabs = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('gameSearch');
  const gameCards = document.querySelectorAll('.game-card');
  const noResultsMsg = document.getElementById('noResultsMsg');

  // Auth Modal Elements
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const authForm = document.getElementById('authForm');
  const usernameGroup = document.getElementById('usernameGroup');
  const authUsername = document.getElementById('authUsername');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authCookieCheck = document.getElementById('authCookieCheck');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const authErrorMsg = document.getElementById('authErrorMsg');
  const authSuccessMsg = document.getElementById('authSuccessMsg');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authSubmitText = document.getElementById('authSubmitText');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');

  // Leaderboard Elements
  const lbTabs = document.querySelectorAll('.lb-tab');
  const refreshLbBtn = document.getElementById('refreshLbBtn');
  const leaderboardBody = document.getElementById('leaderboardBody');
  const leaderboardLoading = document.getElementById('leaderboardLoading');
  const leaderboardEmpty = document.getElementById('leaderboardEmpty');

  // Cookie Consent Elements
  const cookieBanner = document.getElementById('cookieBanner');
  const acceptCookiesBtn = document.getElementById('acceptCookiesBtn');
  const declineCookiesBtn = document.getElementById('declineCookiesBtn');
  const openCookieBannerBtn = document.getElementById('openCookieBannerBtn');

  // Animated Background Engine
  let bgEngine = null;
  const bgCanvas = document.getElementById('arcadeBgCanvas');
  if (bgCanvas) {
    bgEngine = new ArcadeBackgroundEngine(bgCanvas);
    bgEngine.setTheme(currentTheme === 'dark');
  }

  // Theme Functions
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('randoo_theme', theme);

    if (themeIcon && themeText) {
      if (theme === 'light') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
        if (themeToggleBtn) themeToggleBtn.title = 'Switch to Dark Theme';
      } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
        if (themeToggleBtn) themeToggleBtn.title = 'Switch to Light Theme';
      }
    }
    if (bgEngine) bgEngine.setTheme(theme === 'dark');
  }
  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      audio.playPop();
    });
  }

  // Sound Engine UI
  function updateSoundUI() {
    if (!soundIcon || !soundToggleBtn) return;
    if (audio.isMuted) {
      soundIcon.textContent = '🔇';
      soundToggleBtn.classList.add('muted');
    } else {
      soundIcon.textContent = '🔊';
      soundToggleBtn.classList.remove('muted');
    }
  }
  updateSoundUI();

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      updateSoundUI();
      if (!isMuted) audio.playPop();
    });
  }

  // Reset Stats Button
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
      audio.playClick();
      if (confirm('Are you sure you want to reset all arcade scores and play history?')) {
        localStorage.removeItem(STATS_KEY);
        renderStats();
      }
    });
  }

  // Network Fetch with fallback to port 8085
  async function apiFetch(endpoint, options = {}) {
    const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';
    if (!isHttp) throw new Error('Static/file context');

    try {
      const res = await fetch(endpoint, options);
      if (res.ok) return await res.json();
    } catch (e) {}

    if (window.location.port !== '8085') {
      try {
        const res = await fetch('http://localhost:8085' + endpoint, options);
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    throw new Error('API server unavailable');
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = sessionStorage.getItem('randoo_session_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  // Update Header UI for User State
  function updateUserUI() {
    if (currentUser) {
      if (guestAuthActions) guestAuthActions.classList.add('hidden');
      if (authBtn) {
        authBtn.classList.remove('hidden');
        authBtn.classList.add('logged-in');
      }
      if (authBtnText) authBtnText.textContent = currentUser.username;
      if (dropdownUsername) dropdownUsername.textContent = currentUser.username;
      if (dropdownEmail) dropdownEmail.textContent = currentUser.email;

      const profile = getArcadeProfile();
      if (dropStatWins) dropStatWins.textContent = currentUser.stats?.totalWins || profile.totalWins || 0;
      if (dropStatPlayed) dropStatPlayed.textContent = currentUser.stats?.totalPlayed || profile.totalPlayed || 0;
      const reflex = currentUser.stats?.bestReactionMs || profile.bestReactionMs;
      if (dropStatReflex) dropStatReflex.textContent = reflex ? `${Math.round(reflex)}ms` : '--';
    } else {
      if (guestAuthActions) guestAuthActions.classList.remove('hidden');
      if (authBtn) {
        authBtn.classList.add('hidden');
        authBtn.classList.remove('logged-in');
      }
      if (userDropdown) userDropdown.classList.add('hidden');
    }
  }

  // Sync Stats to Vault & Backend
  async function syncStatsToBackend() {
    if (!currentUser) return;
    const local = getArcadeProfile();
    vault.syncUserStats(currentUser.id, local);

    try {
      await apiFetch('/api/stats', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(local)
      });
    } catch (e) {}
  }

  // Sync remote stats into local storage
  function syncLocalWithRemote(remoteStats) {
    if (!remoteStats) return;
    const local = getArcadeProfile();

    local.totalPlayed = Math.max(local.totalPlayed || 0, remoteStats.totalPlayed || 0);
    local.totalWins = Math.max(local.totalWins || 0, remoteStats.totalWins || 0);

    if (remoteStats.bestReactionMs) {
      if (!local.bestReactionMs || remoteStats.bestReactionMs < local.bestReactionMs) {
        local.bestReactionMs = remoteStats.bestReactionMs;
      }
    }

    if (remoteStats.games) {
      local.games = local.games || {};
      for (const [key, val] of Object.entries(remoteStats.games)) {
        if (!local.games[key]) {
          local.games[key] = { played: val.played || 0, wins: val.wins || 0 };
        } else {
          local.games[key].played = Math.max(local.games[key].played || 0, val.played || 0);
          local.games[key].wins = Math.max(local.games[key].wins || 0, val.wins || 0);
          if (val.bestMs) {
            local.games[key].bestMs = local.games[key].bestMs ? Math.min(local.games[key].bestMs, val.bestMs) : val.bestMs;
          }
        }
      }
    }

    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(local));
    } catch (e) {}
  }

  // Render Stats
  function renderStats() {
    const profile = getArcadeProfile();

    let totalPlayed = profile.totalPlayed || 0;
    let totalWins = profile.totalWins || 0;

    if (profile.games) {
      const g = profile.games;
      let calculatedPlayed = (g.rps?.played || 0) + (g.ttt?.played || 0) + (g.guess?.played || 0) + 
                             (g.dice?.played || 0) + (g.hangman?.played || 0) + (g.rtt?.played || 0);
      let calculatedWins = (g.rps?.wins || 0) + (g.ttt?.wins || 0) + (g.guess?.wins || 0) + 
                           (g.dice?.wins || 0) + (g.hangman?.wins || 0);

      totalPlayed = Math.max(totalPlayed, calculatedPlayed);
      totalWins = Math.max(totalWins, calculatedWins);

      if (statCardRPS) statCardRPS.textContent = g.rps?.played || 0;
      if (statCardTTT) statCardTTT.textContent = g.ttt?.played || 0;
      if (statCardGuess) statCardGuess.textContent = g.guess?.played || 0;
      if (statCardDice) statCardDice.textContent = g.dice?.played || 0;
      if (statCardHangman) statCardHangman.textContent = g.hangman?.played || 0;

      const rttBest = profile.games?.rtt?.bestMs || profile.bestReactionMs;
      if (statCardRTT) {
        statCardRTT.textContent = rttBest ? `${Math.round(rttBest)} ms` : '--';
      }
      if (statBestReaction) {
        statBestReaction.textContent = rttBest ? `${Math.round(rttBest)}` : '--';
      }

      const gameNames = {
        rps: 'Rock Paper Scissors',
        ttt: 'Tic-Tac-Toe',
        guess: 'Number Guesser',
        dice: 'Roll The Dice',
        hangman: 'Hangman Quest',
        rtt: 'Reaction Time Test'
      };

      let maxPlayed = 0;
      let topGame = totalPlayed > 0 ? 'Rock Paper Scissors' : '--';
      for (const [key, val] of Object.entries(g)) {
        if (val.played > maxPlayed) {
          maxPlayed = val.played;
          topGame = gameNames[key] || topGame;
        }
      }
      if (statFavoriteGame) statFavoriteGame.textContent = topGame;
    }

    if (statTotalPlayed) statTotalPlayed.textContent = totalPlayed;
    if (statTotalWins) statTotalWins.textContent = totalWins;

    if (currentUser) {
      if (dropStatWins) dropStatWins.textContent = totalWins;
      if (dropStatPlayed) dropStatPlayed.textContent = totalPlayed;
      const reflex = profile.games?.rtt?.bestMs || profile.bestReactionMs;
      if (dropStatReflex) dropStatReflex.textContent = reflex ? `${Math.round(reflex)}ms` : '--';
      syncStatsToBackend();
    }
  }

  // Session Check
  async function checkSession() {
    const localUser = vault.restoreSession();
    if (localUser) {
      currentUser = localUser;
      syncLocalWithRemote(currentUser.stats);
      updateUserUI();
      renderStats();
    }

    try {
      const data = await apiFetch('/api/me', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (data && data.ok && data.user) {
        currentUser = data.user;
        syncLocalWithRemote(currentUser.stats);
        updateUserUI();
        renderStats();
      }
    } catch (e) {}
  }

  // Cookie Consent Handling
  function initCookieConsent() {
    const consent = localStorage.getItem('randoo_cookie_consent');
    if (consent === null) {
      setTimeout(() => {
        if (cookieBanner) cookieBanner.classList.remove('hidden');
      }, 500);
    } else if (consent === 'declined') {
      if (authCookieCheck) authCookieCheck.checked = false;
    } else if (consent === 'accepted') {
      if (authCookieCheck) authCookieCheck.checked = true;
    }

    if (acceptCookiesBtn) {
      acceptCookiesBtn.addEventListener('click', () => {
        audio.playPop();
        localStorage.setItem('randoo_cookie_consent', 'accepted');
        if (cookieBanner) cookieBanner.classList.add('hidden');
        if (authCookieCheck) authCookieCheck.checked = true;
      });
    }

    if (declineCookiesBtn) {
      declineCookiesBtn.addEventListener('click', () => {
        audio.playClick();
        localStorage.setItem('randoo_cookie_consent', 'declined');
        if (cookieBanner) cookieBanner.classList.add('hidden');
        if (authCookieCheck) authCookieCheck.checked = false;
      });
    }

    if (openCookieBannerBtn) {
      openCookieBannerBtn.addEventListener('click', () => {
        audio.playPop();
        if (cookieBanner) cookieBanner.classList.remove('hidden');
      });
    }
  }

  // Auth Modal Management
  function setAuthMode(mode) {
    authMode = mode;
    if (authErrorMsg) authErrorMsg.classList.add('hidden');
    if (authSuccessMsg) authSuccessMsg.classList.add('hidden');

    if (mode === 'login') {
      if (tabLogin) {
        tabLogin.classList.add('active');
        tabLogin.setAttribute('aria-selected', 'true');
      }
      if (tabRegister) {
        tabRegister.classList.remove('active');
        tabRegister.setAttribute('aria-selected', 'false');
      }
      if (usernameGroup) usernameGroup.style.display = 'none';
      if (authUsername) authUsername.removeAttribute('required');
      if (modalTitle) modalTitle.textContent = 'Sign In to Randoo';
      if (modalSubtitle) modalSubtitle.textContent = 'Save your player stats to our encrypted database';
      if (authSubmitText) authSubmitText.textContent = 'Sign In';
    } else {
      if (tabRegister) {
        tabRegister.classList.add('active');
        tabRegister.setAttribute('aria-selected', 'true');
      }
      if (tabLogin) {
        tabLogin.classList.remove('active');
        tabLogin.setAttribute('aria-selected', 'false');
      }
      if (usernameGroup) usernameGroup.style.display = 'flex';
      if (authUsername) authUsername.setAttribute('required', 'true');
      if (modalTitle) modalTitle.textContent = 'Create Arcade Account';
      if (modalSubtitle) modalSubtitle.textContent = 'Join the public leaderboard and encrypt your game records';
      if (authSubmitText) authSubmitText.textContent = 'Create Account';
    }
  }

  function openAuth(mode = 'login') {
    audio.playPop();
    if (authModal) authModal.classList.remove('hidden');
    setAuthMode(mode);
    setTimeout(() => {
      if (mode === 'register' && authUsername) {
        authUsername.focus();
      } else if (authEmail) {
        authEmail.focus();
      }
    }, 100);
  }

  function closeAuth() {
    if (authModal) authModal.classList.add('hidden');
  }

  // Wire Header Auth Buttons
  if (loginBtn) {
    loginBtn.addEventListener('click', () => openAuth('login'));
  }

  if (registerBtn) {
    registerBtn.addEventListener('click', () => openAuth('register'));
  }

  if (authBtn) {
    authBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentUser && userDropdown) {
        userDropdown.classList.toggle('hidden');
        updateUserUI();
      } else {
        openAuth('login');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.contains(e.target) && authBtn && !authBtn.contains(e.target)) {
      userDropdown.classList.add('hidden');
    }
  });

  if (closeAuthModal) closeAuthModal.addEventListener('click', closeAuth);
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuth();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal && !authModal.classList.contains('hidden')) {
      closeAuth();
    }
  });

  if (tabLogin) tabLogin.addEventListener('click', () => { audio.playPop(); setAuthMode('login'); });
  if (tabRegister) tabRegister.addEventListener('click', () => { audio.playPop(); setAuthMode('register'); });

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPwd = authPassword.type === 'password';
      authPassword.type = isPwd ? 'text' : 'password';
      togglePasswordBtn.textContent = isPwd ? '🙈' : '👁️';
    });
  }

  // Auth Form Submit
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      authErrorMsg.classList.add('hidden');
      authSuccessMsg.classList.add('hidden');

      const email = authEmail.value.trim();
      const password = authPassword.value;
      const username = authUsername ? authUsername.value.trim() : '';
      const allowCookies = authCookieCheck ? authCookieCheck.checked : true;

      if (allowCookies) {
        localStorage.setItem('randoo_cookie_consent', 'accepted');
        if (cookieBanner) cookieBanner.classList.add('hidden');
      }

      if (authMode === 'register' && (!username || username.length < 2)) {
        authErrorMsg.textContent = 'Please enter a valid username (min 2 characters).';
        authErrorMsg.classList.remove('hidden');
        return;
      }

      if (!email || !email.includes('@')) {
        authErrorMsg.textContent = 'Please provide a valid email address.';
        authErrorMsg.classList.remove('hidden');
        return;
      }

      if (!password || password.length < 6) {
        authErrorMsg.textContent = 'Password must be at least 6 characters long.';
        authErrorMsg.classList.remove('hidden');
        return;
      }

      authSubmitBtn.disabled = true;
      authSubmitText.textContent = authMode === 'register' ? 'Creating...' : 'Signing In...';

      let authResult = null;

      try {
        const endpoint = authMode === 'register' ? '/api/register' : '/api/login';
        const payload = authMode === 'register'
          ? { username, email, password, allowCookies }
          : { email, password, allowCookies };

        const data = await apiFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (data && data.ok) {
          authResult = data;
        }
      } catch (networkErr) {
        // Fallback to client vault
      }

      if (!authResult) {
        try {
          if (authMode === 'register') {
            authResult = vault.register(username, email, password);
          } else {
            authResult = vault.login(email, password);
          }
        } catch (vaultErr) {
          authErrorMsg.textContent = vaultErr.message;
          authErrorMsg.classList.remove('hidden');
          audio.playClick();
          authSubmitBtn.disabled = false;
          authSubmitText.textContent = authMode === 'register' ? 'Create Account' : 'Sign In';
          return;
        }
      }

      if (authResult && authResult.user) {
        currentUser = authResult.user;
        vault.saveSession(currentUser, authResult.token, allowCookies);

        authSuccessMsg.textContent = authMode === 'register' ? 'Account created successfully!' : 'Signed in successfully!';
        authSuccessMsg.classList.remove('hidden');
        audio.playPop();

        await syncStatsToBackend();
        syncLocalWithRemote(currentUser.stats);
        updateUserUI();
        renderStats();
        fetchLeaderboard(activeLbSort);

        setTimeout(() => {
          closeAuth();
          authSubmitBtn.disabled = false;
          setAuthMode('login');
        }, 700);
      }
    });
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      audio.playClick();
      try {
        await apiFetch('/api/logout', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
      } catch (e) {}

      vault.clearSession();
      currentUser = null;
      updateUserUI();
      if (userDropdown) userDropdown.classList.add('hidden');
      fetchLeaderboard(activeLbSort);
    });
  }

  // Leaderboard System
  async function fetchLeaderboard(sort = 'wins') {
    activeLbSort = sort;

    const localLeaderboard = vault.getLeaderboard(sort);
    renderLeaderboardRows(localLeaderboard);

    try {
      const data = await apiFetch(`/api/leaderboard?sort=${sort}&limit=25`);
      if (data && data.ok && Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
        renderLeaderboardRows(data.leaderboard);
      }
    } catch (e) {}
  }

  function renderLeaderboardRows(players) {
    if (!leaderboardBody) return;
    if (!players || players.length === 0) {
      if (leaderboardEmpty) leaderboardEmpty.classList.remove('hidden');
      leaderboardBody.innerHTML = '';
      return;
    }

    if (leaderboardEmpty) leaderboardEmpty.classList.add('hidden');
    if (leaderboardLoading) leaderboardLoading.classList.add('hidden');

    leaderboardBody.innerHTML = players.map(p => {
      let rankHtml = '';
      if (p.rank === 1) {
        rankHtml = '<span class="rank-badge rank-gold" title="1st Place Champion">🥇 1</span>';
      } else if (p.rank === 2) {
        rankHtml = '<span class="rank-badge rank-silver" title="2nd Place">🥈 2</span>';
      } else if (p.rank === 3) {
        rankHtml = '<span class="rank-badge rank-bronze" title="3rd Place">🥉 3</span>';
      } else {
        rankHtml = `<span class="rank-standard">#${p.rank}</span>`;
      }

      const isYou = currentUser && (currentUser.username.toLowerCase() === p.username.toLowerCase());
      const youBadge = isYou ? '<span class="player-tag-you">YOU</span>' : '';
      const reflexText = p.bestReactionMs ? `${Math.round(p.bestReactionMs)} ms` : '--';
      const winRate = p.winRate || 0;

      return `
        <tr class="${isYou ? 'current-player-row' : ''}">
          <td class="col-rank">${rankHtml}</td>
          <td class="col-player">
            <div class="player-cell">
              <span class="player-avatar">${p.rank === 1 ? '👑' : '👾'}</span>
              <span class="player-name">${escapeHtml(p.username)}</span>
              ${youBadge}
            </div>
          </td>
          <td class="col-wins wins-cell"><strong>${p.totalWins}</strong></td>
          <td class="col-played">${p.totalPlayed}</td>
          <td class="col-rate rate-cell">
            <span class="win-rate-pill">
              <span>${winRate}%</span>
            </span>
          </td>
          <td class="col-reflex reflex-cell">${reflexText}</td>
        </tr>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Wire Leaderboard Tabs
  lbTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      audio.playPop();
      lbTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const sort = tab.getAttribute('data-sort');
      fetchLeaderboard(sort);
    });
  });

  if (refreshLbBtn) {
    refreshLbBtn.addEventListener('click', () => {
      audio.playPop();
      fetchLeaderboard(activeLbSort);
    });
  }

  // Filter Tabs & Search
  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let visibleCount = 0;

    gameCards.forEach(card => {
      const categories = card.getAttribute('data-category').toLowerCase();
      const text = card.textContent.toLowerCase();

      const matchesCategory = (activeFilter === 'all') || categories.includes(activeFilter);
      const matchesSearch = query === '' || text.includes(query);

      if (matchesCategory && matchesSearch) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    if (noResultsMsg) {
      if (visibleCount === 0) {
        noResultsMsg.classList.remove('hidden');
      } else {
        noResultsMsg.classList.add('hidden');
      }
    }
  }

  let activeFilter = 'all';
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      audio.playPop();
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.getAttribute('data-category');
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // Card & Button Sounds
  document.querySelectorAll('.play-btn, .card-media, .action-btn, .filter-tab').forEach(btn => {
    btn.addEventListener('mouseenter', () => audio.playPop());
  });
  document.querySelectorAll('.play-btn, .card-media').forEach(btn => {
    btn.addEventListener('click', () => audio.playClick());
  });

  // Re-check stats on page focus/return
  window.addEventListener('pageshow', () => {
    renderStats();
    fetchLeaderboard(activeLbSort);
  });
  window.addEventListener('focus', () => {
    renderStats();
    fetchLeaderboard(activeLbSort);
  });
  window.addEventListener('storage', renderStats);

  // Initialize Systems
  initCookieConsent();
  checkSession();
  renderStats();
  fetchLeaderboard('wins');
});

