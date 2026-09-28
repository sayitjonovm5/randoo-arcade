/**
 * RANDOO ARCADE - SIMPLE ENCRYPTED DATABASE ENGINE
 * Uses AES-256-GCM Authenticated Encryption to protect all user credentials and player stats on disk.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EncryptedArcadeDB {
  constructor(dbFilePath, secretKey) {
    this.dbFilePath = dbFilePath || path.join(__dirname, 'data', 'arcade_database.enc');
    // 32-byte master encryption key
    this.masterKey = crypto.scryptSync(secretKey || 'randoo-arcade-master-cipher-secret-key-2026', 'randoo-salt', 32);
    this.data = {
      users: [],
      sessions: [],
      meta: {
        createdAt: new Date().toISOString(),
        version: '1.0'
      }
    };
    this.init();
  }

  init() {
    const dir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbFilePath)) {
      this.load();
    } else {
      // Initialize fresh empty encrypted database - real users only, no bots
      this.save();
    }
  }

  save() {
    try {
      const plaintext = Buffer.from(JSON.stringify(this.data), 'utf8');
      const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
      
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const authTag = cipher.getAuthTag(); // 16-byte GCM authentication tag

      // Format: [12 bytes IV] [16 bytes AuthTag] [Ciphertext]
      const fileBuffer = Buffer.concat([iv, authTag, ciphertext]);
      fs.writeFileSync(this.dbFilePath, fileBuffer);
      return true;
    } catch (err) {
      console.error('Failed to encrypt and save database:', err);
      return false;
    }
  }

  load() {
    try {
      const fileBuffer = fs.readFileSync(this.dbFilePath);
      if (fileBuffer.length < 28) {
        throw new Error('Database file corrupted or too short');
      }

      const iv = fileBuffer.subarray(0, 12);
      const authTag = fileBuffer.subarray(12, 28);
      const ciphertext = fileBuffer.subarray(28);

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);

      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      this.data = JSON.parse(plaintext.toString('utf8'));
      if (!this.data.users) this.data.users = [];
      if (!this.data.sessions) this.data.sessions = [];

      // Purge any dummy bots from older versions
      const botUsernames = ['NeoGamer', 'CyberPixel', 'ArcadeMaster', 'ShadowStrike', 'LuckyRoller', 'PixelNinja', 'QuantumSpeed', 'RetroViper'];
      const initialCount = this.data.users.length;
      this.data.users = this.data.users.filter(u => {
        const isBotEmail = u.email && (u.email.endsWith('@randoo.net') || u.email.endsWith('@arcade.net'));
        const isBotName = botUsernames.includes(u.username);
        return !isBotEmail && !isBotName;
      });

      if (this.data.users.length !== initialCount) {
        this.save();
      }

      return true;
    } catch (err) {
      console.error('Failed to decrypt database, initializing fresh store:', err.message);
      this.data = { users: [], sessions: [], meta: { createdAt: new Date().toISOString() } };
      this.save();
      return false;
    }
  }

  // --- USER AUTHENTICATION LOGIC ---

  register(username, password, avatar = null) {
    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      throw new Error('Username must be at least 2 characters long.');
    }
    if (username.trim().length > 25) {
      throw new Error('Username cannot exceed 25 characters.');
    }
    if (!password || password.length < 5) {
      throw new Error('Password must be at least 5 characters long.');
    }

    const cleanUsername = username.trim();

    // Check existing
    const usernameExists = this.data.users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (usernameExists) {
      throw new Error('This username is already taken. Please choose another.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');

    const newUser = {
      id: 'user_' + crypto.randomBytes(8).toString('hex'),
      username: cleanUsername,
      avatar: (typeof avatar === 'string' && avatar.startsWith('data:image/')) ? avatar : null,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      stats: {
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
      }
    };

    this.data.users.push(newUser);
    const sessionToken = this.createSession(newUser.id);
    this.save();

    return { user: this.sanitizeUser(newUser), token: sessionToken };
  }

  updateAvatar(userId, avatar) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image/')) {
      user.avatar = avatar;
    } else {
      user.avatar = null;
    }

    user.lastActive = new Date().toISOString();
    this.save();
    return this.sanitizeUser(user);
  }

  login(username, password) {
    if (!username || !password) {
      throw new Error('Please enter your username and password.');
    }

    const cleanUser = username.trim().toLowerCase();
    const user = this.data.users.find(u => 
      u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)
    );

    if (!user) {
      throw new Error('Invalid username or password.');
    }

    const testHash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    const match = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(user.passwordHash, 'hex'));

    if (!match) {
      throw new Error('Invalid username or password.');
    }

    user.lastActive = new Date().toISOString();
    const sessionToken = this.createSession(user.id);
    this.save();

    return { user: this.sanitizeUser(user), token: sessionToken };
  }

  createSession(userId, durationDays = 30) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
    this.data.sessions.push({ token, userId, expiresAt });
    return token;
  }

  validateSession(token) {
    if (!token) return null;
    const session = this.data.sessions.find(s => s.token === token && s.expiresAt > Date.now());
    if (!session) return null;

    const user = this.data.users.find(u => u.id === session.userId);
    if (!user) return null;

    return this.sanitizeUser(user);
  }

  destroySession(token) {
    if (!token) return false;
    const initialLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    if (this.data.sessions.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  sanitizeUser(user) {
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar || null,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      stats: user.stats
    };
  }

  // --- STATS MERGING & UPDATING ---

  syncUserStats(userId, clientStats) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;

    if (!clientStats || typeof clientStats !== 'object') return this.sanitizeUser(user);

    user.lastActive = new Date().toISOString();
    const uStats = user.stats;

    // Merge total numbers
    uStats.totalPlayed = Math.max(uStats.totalPlayed || 0, clientStats.totalPlayed || 0);
    uStats.totalWins = Math.max(uStats.totalWins || 0, clientStats.totalWins || 0);

    // Merge best reaction time (lower is better, ignoring 0 or null)
    if (typeof clientStats.bestReactionMs === 'number' && clientStats.bestReactionMs > 0) {
      if (!uStats.bestReactionMs || clientStats.bestReactionMs < uStats.bestReactionMs) {
        uStats.bestReactionMs = Math.round(clientStats.bestReactionMs);
      }
    }

    // Merge individual games
    if (clientStats.games && typeof clientStats.games === 'object') {
      for (const [key, g] of Object.entries(clientStats.games)) {
        if (!uStats.games[key]) uStats.games[key] = { played: 0, wins: 0 };
        uStats.games[key].played = Math.max(uStats.games[key].played || 0, g.played || 0);
        if (g.wins !== undefined) {
          uStats.games[key].wins = Math.max(uStats.games[key].wins || 0, g.wins || 0);
        }
        if (g.bestMs && typeof g.bestMs === 'number') {
          if (!uStats.games[key].bestMs || g.bestMs < uStats.games[key].bestMs) {
            uStats.games[key].bestMs = Math.round(g.bestMs);
          }
        }
      }
    }

    this.save();
    return this.sanitizeUser(user);
  }

  // --- PUBLIC LEADERBOARD QUERY ---

  getLeaderboard(sortBy = 'wins', limit = 25) {
    const list = this.data.users.map(u => {
      const stats = u.stats || {};
      const completed = stats.totalPlayed || 0;
      const wins = stats.totalWins || 0;
      const winRate = completed > 0 ? Math.round((wins / completed) * 100) : 0;

      return {
        id: u.id,
        username: u.username,
        avatar: u.avatar || null,
        totalWins: wins,
        totalPlayed: completed,
        bestReactionMs: stats.bestReactionMs || null,
        winRate: winRate,
        lastActive: u.lastActive
      };
    });

    if (sortBy === 'played') {
      list.sort((a, b) => b.totalPlayed - a.totalPlayed || b.totalWins - a.totalWins);
    } else if (sortBy === 'reaction') {
      list.sort((a, b) => {
        if (a.bestReactionMs === null && b.bestReactionMs === null) return 0;
        if (a.bestReactionMs === null) return 1;
        if (b.bestReactionMs === null) return -1;
        return a.bestReactionMs - b.bestReactionMs;
      });
    } else {
      // Default: wins
      list.sort((a, b) => b.totalWins - a.totalWins || b.winRate - a.winRate || b.totalPlayed - a.totalPlayed);
    }

    return list.slice(0, limit).map((player, idx) => ({
      rank: idx + 1,
      ...player
    }));
  }
}

module.exports = EncryptedArcadeDB;
