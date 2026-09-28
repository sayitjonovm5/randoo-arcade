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
    if (raw) return RankedStats.normalize(JSON.parse(raw));
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

  isBotUser(u) {
    if (!u) return false;
    if (u.isBot) return true;
    const botEmails = ['neo@arcade.net', 'cyber@arcade.net', 'ninja@arcade.net', 'speed@arcade.net', 'viper@arcade.net'];
    const botNames = ['NeoGamer', 'CyberPixel', 'PixelNinja', 'QuantumSpeed', 'RetroViper', 'ArcadeMaster', 'ShadowStrike', 'LuckyRoller'];
    if (u.email && (botEmails.includes(u.email) || u.email.endsWith('@randoo.net') || u.email.endsWith('@arcade.net') || u.email.toLowerCase().includes('bot'))) return true;
    if (u.username && (botNames.includes(u.username) || /bot/i.test(u.username))) return true;
    return false;
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = this.decrypt(raw);
        if (data && data.users) {
          // Purge any dummy bots from older versions
          let changed = false;
          for (const [key, u] of Object.entries(data.users)) {
            if (this.isBotUser(u) || this.isBotUser({ username: key })) {
              delete data.users[key];
              changed = true;
            }
          }
          if (changed) this.save(data);
          return data;
        }
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
      users: {}
    };
    this.save(initial);
    return initial;
  }

  init() {
    // Clear old accounts, rankings, and login state once after the database reset.
    const resetVersion = '2026-09-28-v2-clean-reset';
    if (localStorage.getItem('randoo_data_reset_version') !== resetVersion) {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(STATS_KEY);
      this.clearSession();
      localStorage.setItem('randoo_data_reset_version', resetVersion);
    }
    this.load();
  }

  register(username, password, avatar = null) {
    const data = this.load();
    const normUser = username.trim();

    if (!normUser || normUser.length < 2) {
      throw new Error('Username must be at least 2 characters long.');
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
      avatar: (avatar && typeof avatar === 'string' && avatar.startsWith('data:image/')) ? avatar : null,
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

    data.users[normUser.toLowerCase()] = user;
    this.save(data);

    const token = 'token_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    return { user: this.sanitize(user), token };
  }

  updateAvatar(userId, avatar) {
    if (!userId) return null;
    const data = this.load();
    for (const u of Object.values(data.users)) {
      if (u.id === userId) {
        u.avatar = (avatar && typeof avatar === 'string' && avatar.startsWith('data:image/')) ? avatar : null;
        this.save(data);
        return this.sanitize(u);
      }
    }
    return null;
  }

  login(username, password) {
    const data = this.load();
    const cleanUser = (username || '').toLowerCase().trim();
    let user = data.users[cleanUser];
    if (!user) {
      user = Object.values(data.users).find(u => 
        u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)
      );
    }
    if (!user) {
      throw new Error('No player found with this username. Please check your spelling or register.');
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
    const list = Object.values(data.users).filter(u => !this.isBotUser(u)).map(u => {
      const ranked = RankedStats.normalize(u.stats);
      const played = ranked.totalPlayed;
      const wins = ranked.totalWins;
      const rate = played > 0 ? Math.round((wins / played) * 100) : 0;
      return {
        id: u.id,
        username: u.username,
        avatar: u.avatar || null,
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
    const copy = { ...user, stats: RankedStats.normalize(user.stats) };
    delete copy.passwordHash;
    delete copy.salt;
    return copy;
  }
}

// Image Compressor & Square Cropper for Avatars
function compressImageFile(file, maxWidth = 160, maxHeight = 160, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPG, PNG, WebP).'));
    }
    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error('Selected image is too large. Max 10MB allowed.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        const outSize = Math.min(maxWidth, minDim);
        canvas.width = outSize;
        canvas.height = outSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, outSize, outSize);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
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

  // User Auth & Avatar Elements
  const guestAuthActions = document.getElementById('guestAuthActions');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const authBtn = document.getElementById('authBtn');
  const authBtnText = document.getElementById('authBtnText');
  const headerAvatarImg = document.getElementById('headerAvatarImg');
  const authIcon = document.getElementById('authIcon');
  const userDropdown = document.getElementById('userDropdown');
  const dropdownAvatarWrap = document.getElementById('dropdownAvatarWrap');
  const dropdownAvatarImg = document.getElementById('dropdownAvatarImg');
  const dropdownAvatar = document.getElementById('dropdownAvatar');
  const dropdownUsername = document.getElementById('dropdownUsername');
  const dropdownEmail = document.getElementById('dropdownEmail');
  const changeAvatarInput = document.getElementById('changeAvatarInput');
  const triggerChangePhotoBtn = document.getElementById('triggerChangePhotoBtn');
  const dropStatWins = document.getElementById('dropStatWins');
  const dropStatPlayed = document.getElementById('dropStatPlayed');
  const dropStatReflex = document.getElementById('dropStatReflex');
  const logoutBtn = document.getElementById('logoutBtn');

  // Registration Avatar Elements
  const avatarGroup = document.getElementById('avatarGroup');
  const regAvatarInput = document.getElementById('regAvatarInput');
  const regAvatarImg = document.getElementById('regAvatarImg');
  const regAvatarPlaceholder = document.getElementById('regAvatarPlaceholder');
  const removeAvatarBtn = document.getElementById('removeAvatarBtn');
  let selectedRegAvatar = null;

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
  const emptyLbJoinBtn = document.getElementById('emptyLbJoinBtn');

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

  // Network Fetch with localhost port 8085 fallback (safe for both local dev and production CDN)
  async function apiFetch(endpoint, options = {}) {
    const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';
    if (!isHttp) throw new Error('Static/file context');

    try {
      const res = await fetch(endpoint, { ...options, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) { const error = new Error(data.error || 'Account service unavailable.'); error.apiResponse = true; throw error; }
      return data;
    } catch (e) { if (e.apiResponse) throw e; }

    // Only fallback to localhost:8085 when developing locally, avoiding Mixed-Content on Vercel
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost && window.location.port !== '8085') {
      try {
        const res = await fetch('http://localhost:8085' + endpoint, options);
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    throw new Error('API server unavailable');
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    let token = sessionStorage.getItem('randoo_session_token');
    if (!token) {
      try { token = JSON.parse(localStorage.getItem('randoo_active_session'))?.token; } catch (e) {}
    }
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
      if (dropdownEmail) dropdownEmail.textContent = currentUser.email || 'Verified Player';

      // Handle Profile Photo / Avatar
      if (currentUser.avatar) {
        if (headerAvatarImg) {
          headerAvatarImg.src = currentUser.avatar;
          headerAvatarImg.classList.remove('hidden');
        }
        if (authIcon) authIcon.classList.add('hidden');

        if (dropdownAvatarImg) {
          dropdownAvatarImg.src = currentUser.avatar;
          dropdownAvatarImg.classList.remove('hidden');
        }
        if (dropdownAvatar) dropdownAvatar.classList.add('hidden');
      } else {
        if (headerAvatarImg) {
          headerAvatarImg.src = '';
          headerAvatarImg.classList.add('hidden');
        }
        if (authIcon) authIcon.classList.remove('hidden');

        if (dropdownAvatarImg) {
          dropdownAvatarImg.src = '';
          dropdownAvatarImg.classList.add('hidden');
        }
        if (dropdownAvatar) {
          dropdownAvatar.classList.remove('hidden');
          dropdownAvatar.textContent = currentUser.username ? currentUser.username.charAt(0).toUpperCase() : '👾';
        }
      }

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
      if (headerAvatarImg) headerAvatarImg.classList.add('hidden');
      if (authIcon) authIcon.classList.remove('hidden');
      if (dropdownAvatarImg) dropdownAvatarImg.classList.add('hidden');
      if (dropdownAvatar) dropdownAvatar.classList.remove('hidden');
      if (userDropdown) userDropdown.classList.add('hidden');
    }
  }

  function selectAccount(user) {
    const ownerKey = 'randoo_profile_owner';
    if (localStorage.getItem(ownerKey) !== user.id) {
      localStorage.setItem(STATS_KEY, JSON.stringify(RankedStats.normalize(user.stats)));
    }
    localStorage.setItem(ownerKey, user.id);
    currentUser = user;
  }

  // Sync Stats to Vault & Backend
  async function syncStatsToBackend() {
    if (!currentUser) return;
    if (localStorage.getItem('randoo_profile_owner') !== currentUser.id && window.location.protocol !== 'file:') return;
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
      localStorage.setItem(STATS_KEY, JSON.stringify(RankedStats.normalize(local)));
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
                             (g.hangman?.played || 0);
      let calculatedWins = (g.rps?.wins || 0) + (g.ttt?.wins || 0) + (g.guess?.wins || 0) + 
                           (g.hangman?.wins || 0);

      totalPlayed = calculatedPlayed;
      totalWins = calculatedWins;

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
        if (RankedStats.games.includes(key) && val.played > maxPlayed) {
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
    const localUser = window.location.protocol === 'file:' ? vault.restoreSession() : null;
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
      if (data && data.ok && !data.user) {
        vault.clearSession();
        currentUser = null;
        updateUserUI();
      }
      if (data && data.ok && data.user) {
        selectAccount(data.user);
        syncLocalWithRemote(currentUser.stats);
        updateUserUI();
        renderStats();
        await syncStatsToBackend();
        fetchLeaderboard(activeLbSort);
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
  function clearRegAvatar() {
    selectedRegAvatar = null;
    if (regAvatarInput) regAvatarInput.value = '';
    if (regAvatarImg) {
      regAvatarImg.src = '';
      regAvatarImg.classList.add('hidden');
    }
    if (regAvatarPlaceholder) regAvatarPlaceholder.classList.remove('hidden');
    if (removeAvatarBtn) removeAvatarBtn.classList.add('hidden');
  }

  function setAuthMode(mode) {
    authMode = mode;
    if (authErrorMsg) authErrorMsg.classList.add('hidden');
    if (authSuccessMsg) authSuccessMsg.classList.add('hidden');

    if (usernameGroup) usernameGroup.style.display = 'flex';
    if (authUsername) authUsername.setAttribute('required', 'true');

    if (mode === 'login') {
      if (tabLogin) {
        tabLogin.classList.add('active');
        tabLogin.setAttribute('aria-selected', 'true');
      }
      if (tabRegister) {
        tabRegister.classList.remove('active');
        tabRegister.setAttribute('aria-selected', 'false');
      }
      if (avatarGroup) avatarGroup.style.display = 'none';
      if (modalTitle) modalTitle.textContent = 'Sign In to Randoo';
      if (modalSubtitle) modalSubtitle.textContent = 'Enter your username and password to load your stats';
      if (authSubmitText) authSubmitText.textContent = 'Sign In';
      clearRegAvatar();
    } else {
      if (tabRegister) {
        tabRegister.classList.add('active');
        tabRegister.setAttribute('aria-selected', 'true');
      }
      if (tabLogin) {
        tabLogin.classList.remove('active');
        tabLogin.setAttribute('aria-selected', 'false');
      }
      if (avatarGroup) avatarGroup.style.display = 'flex';
      if (modalTitle) modalTitle.textContent = 'Create Arcade Account';
      if (modalSubtitle) modalSubtitle.textContent = 'Choose your username, profile photo, and password';
      if (authSubmitText) authSubmitText.textContent = 'Create Account';
    }
  }

  function openAuth(mode = 'login') {
    audio.playPop();
    if (authModal) authModal.classList.remove('hidden');
    setAuthMode(mode);
    setTimeout(() => {
      if (authUsername) authUsername.focus();
    }, 100);
  }

  function closeAuth() {
    if (authModal) authModal.classList.add('hidden');
  }

  // Wire Registration Avatar Upload & Preview
  if (regAvatarInput) {
    regAvatarInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await compressImageFile(file, 160, 160, 0.85);
        selectedRegAvatar = dataUrl;
        if (regAvatarImg) {
          regAvatarImg.src = dataUrl;
          regAvatarImg.classList.remove('hidden');
        }
        if (regAvatarPlaceholder) regAvatarPlaceholder.classList.add('hidden');
        if (removeAvatarBtn) removeAvatarBtn.classList.remove('hidden');
        audio.playPop();
      } catch (err) {
        alert(err.message);
        clearRegAvatar();
      }
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', () => {
      audio.playClick();
      clearRegAvatar();
    });
  }

  // Wire Change Profile Photo from User Dropdown
  if (triggerChangePhotoBtn && changeAvatarInput) {
    triggerChangePhotoBtn.addEventListener('click', () => {
      audio.playPop();
      changeAvatarInput.click();
    });
  }

  if (changeAvatarInput) {
    changeAvatarInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file || !currentUser) return;
      try {
        const dataUrl = await compressImageFile(file, 160, 160, 0.85);

        // Update in client vault
        const updatedLocal = vault.updateAvatar(currentUser.id, dataUrl);
        if (updatedLocal) {
          currentUser = updatedLocal;
          vault.saveSession(currentUser, sessionStorage.getItem('randoo_session_token'));
        }

        // Sync with backend API
        try {
          const res = await apiFetch('/api/avatar', {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ avatar: dataUrl })
          });
          if (res && res.ok && res.user) {
            currentUser = res.user;
          }
        } catch (netErr) {}

        updateUserUI();
        fetchLeaderboard(activeLbSort);
        audio.playPop();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Wire Empty Leaderboard Join CTA
  if (emptyLbJoinBtn) {
    emptyLbJoinBtn.addEventListener('click', () => {
      audio.playPop();
      openAuth('register');
    });
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

      const username = authUsername ? authUsername.value.trim() : '';
      const password = authPassword ? authPassword.value : '';
      const allowCookies = authCookieCheck ? authCookieCheck.checked : true;

      if (allowCookies) {
        localStorage.setItem('randoo_cookie_consent', 'accepted');
        if (cookieBanner) cookieBanner.classList.add('hidden');
      }

      if (!username || username.length < 2) {
        authErrorMsg.textContent = 'Please enter your username (min 2 characters).';
        authErrorMsg.classList.remove('hidden');
        if (authUsername) authUsername.focus();
        return;
      }

      if (username.length > 25) {
        authErrorMsg.textContent = 'Username cannot exceed 25 characters.';
        authErrorMsg.classList.remove('hidden');
        return;
      }

      if (!password || password.length < 6) {
        authErrorMsg.textContent = 'Password must be at least 6 characters long.';
        authErrorMsg.classList.remove('hidden');
        if (authPassword) authPassword.focus();
        return;
      }

      authSubmitBtn.disabled = true;
      authSubmitText.textContent = authMode === 'register' ? 'Creating...' : 'Signing In...';

      let authResult = null;
      let authFailure = '';

      try {
        const endpoint = authMode === 'register' ? '/api/register' : '/api/login';
        const payload = authMode === 'register'
          ? { username, password, avatar: selectedRegAvatar, allowCookies }
          : { username, password, allowCookies };

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
        authFailure = networkErr.message;
      }

      if (!authResult && window.location.protocol !== 'file:') {
        authErrorMsg.textContent = authFailure || 'Account service unavailable. Please try again later.';
        authErrorMsg.classList.remove('hidden');
        authSubmitBtn.disabled = false;
        authSubmitText.textContent = authMode === 'register' ? 'Create Account' : 'Sign In';
        return;
      }
      if (!authResult) {
        try {
          if (authMode === 'register') {
            authResult = vault.register(username, password, selectedRegAvatar);
          } else {
            authResult = vault.login(username, password);
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
        selectAccount(authResult.user);
        vault.saveSession(currentUser, authResult.token, allowCookies);

        authSuccessMsg.textContent = authMode === 'register' ? 'Account created successfully!' : 'Signed in successfully!';
        authSuccessMsg.classList.remove('hidden');
        audio.playPop();

        await syncStatsToBackend();
        syncLocalWithRemote(currentUser.stats);
        updateUserUI();
        renderStats();
        fetchLeaderboard(activeLbSort);
        clearRegAvatar();

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
      localStorage.removeItem(STATS_KEY);
      localStorage.removeItem('randoo_profile_owner');
      currentUser = null;
      renderStats();
      updateUserUI();
      if (userDropdown) userDropdown.classList.add('hidden');
      fetchLeaderboard(activeLbSort);
    });
  }

  // Online rankings always come from the shared server database.
  let leaderboardRequest = 0;
  async function fetchLeaderboard(sort = 'wins') {
    activeLbSort = sort;
    const request = ++leaderboardRequest;
    if (window.location.protocol === 'file:') {
      renderLeaderboardRows(vault.getLeaderboard(sort));
      return;
    }
    if (leaderboardLoading) {
      leaderboardLoading.textContent = 'Loading rankings...';
      leaderboardLoading.classList.remove('hidden');
    }
    try {
      const data = await apiFetch('/api/leaderboard?sort=' + sort + '&limit=25');
      if (request !== leaderboardRequest) return;
      if (!data.ok || !Array.isArray(data.leaderboard)) throw new Error('Invalid rankings');
      renderLeaderboardRows(data.leaderboard);
    } catch (e) {
      if (request !== leaderboardRequest) return;
      if (leaderboardBody) leaderboardBody.innerHTML = '';
      if (leaderboardEmpty) leaderboardEmpty.classList.add('hidden');
      if (leaderboardLoading) {
        leaderboardLoading.textContent = 'Leaderboard unavailable. Please try again later.';
        leaderboardLoading.classList.remove('hidden');
      }
    }
  }

  function renderLeaderboardRows(players) {
    if (!leaderboardBody) return;
    if (leaderboardLoading) leaderboardLoading.classList.add('hidden');
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
        rankHtml = '<span class="rank-badge rank-gold" title="1st Place Champion">🥇</span>';
      } else if (p.rank === 2) {
        rankHtml = '<span class="rank-badge rank-silver" title="2nd Place">🥈</span>';
      } else if (p.rank === 3) {
        rankHtml = '<span class="rank-badge rank-bronze" title="3rd Place">🥉</span>';
      } else {
        rankHtml = `<span class="rank-standard">#${p.rank}</span>`;
      }

      const isYou = currentUser && (currentUser.username.toLowerCase() === p.username.toLowerCase());
      const youBadge = isYou ? '<span class="player-tag-you">YOU</span>' : '';
      const winRate = p.winRate || 0;

      return `
        <tr class="${isYou ? 'current-player-row' : ''}">
          <td class="col-rank">${rankHtml}</td>
          <td class="col-player">
            <div class="player-cell">
              <div class="player-avatar-wrap">
                ${p.avatar
                  ? `<img class="player-avatar-img" src="${p.avatar}" alt="${escapeHtml(p.username)}">`
                  : `<span class="avatar-fallback-initial">${escapeHtml(p.username ? p.username.charAt(0).toUpperCase() : '?')}</span>`
                }
              </div>
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

