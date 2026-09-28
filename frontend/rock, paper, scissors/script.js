/**
 * ROCK PAPER SCISSORS DUEL - MARKOV CHAIN PREDICTIVE AI & TOURNAMENT ENGINE
 */

// Sound Controller with HTML5 audio + synthesized fallback
class RPSAudio {
  constructor() {
    this.isMuted = localStorage.getItem('randoo_sound_muted') === 'true';
    this.ctx = null;

    // Local Audio files
    this.audioWin = new Audio('correct.mp3');
    this.audioLoss = new Audio('wrong.mp3');
    this.audioTie = new Audio('tie.mp3');
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

  playTick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
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
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playWin() {
    if (this.isMuted) return;
    this.audioWin.currentTime = 0;
    this.audioWin.play().catch(() => {
      // Synthesizer fallback
      this.synthTone(587.33, 'triangle', 0.2);
      setTimeout(() => this.synthTone(880, 'sine', 0.3), 120);
    });
  }

  playLoss() {
    if (this.isMuted) return;
    this.audioLoss.currentTime = 0;
    this.audioLoss.play().catch(() => {
      this.synthTone(260, 'sawtooth', 0.25);
    });
  }

  playTie() {
    if (this.isMuted) return;
    this.audioTie.currentTime = 0;
    this.audioTie.play().catch(() => {
      this.synthTone(400, 'sine', 0.15);
    });
  }

  synthTone(freq, type = 'sine', duration = 0.15) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
}

// Confetti Effect
class ConfettiEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 75) {
    const colors = ['#00f2fe', '#4facfe', '#00e676', '#ffb300', '#ff007f', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.7) * 18,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.01
      });
    }
    if (!this.animId) this.animate();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.alpha <= 0 || p.y > this.canvas.height) {
        this.particles.splice(idx, 1);
      }
    });

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.animate());
    } else {
      this.animId = null;
    }
  }
}

// Markov Chain 2nd-Order Predictor
class MarkovPredictor {
  constructor() {
    this.transitions = {}; // key: "prevMove_outcome" -> { rock: N, paper: N, scissors: N }
    this.lastPlayerMove = null;
    this.lastOutcome = null;
  }

  recordRound(playerMove, outcome) {
    if (this.lastPlayerMove && this.lastOutcome) {
      const key = `${this.lastPlayerMove}_${this.lastOutcome}`;
      if (!this.transitions[key]) {
        this.transitions[key] = { rock: 0, paper: 0, scissors: 0 };
      }
      this.transitions[key][playerMove]++;
    }
    this.lastPlayerMove = playerMove;
    this.lastOutcome = outcome;
  }

  predictNextMove() {
    const moves = ['rock', 'paper', 'scissors'];
    if (!this.lastPlayerMove || !this.lastOutcome) {
      return moves[Math.floor(Math.random() * 3)];
    }

    const key = `${this.lastPlayerMove}_${this.lastOutcome}`;
    const hist = this.transitions[key];

    if (!hist) {
      // Psychological fallback (Wang et al):
      // If player won, they often repeat. If lost, they often shift to what beats the winning move.
      if (this.lastOutcome === 'win') return this.lastPlayerMove;
      return moves[Math.floor(Math.random() * 3)];
    }

    // Find the move the player picked most frequently in this state
    let maxCount = -1;
    let predictedMove = moves[Math.floor(Math.random() * 3)];

    for (const m of moves) {
      if (hist[m] > maxCount) {
        maxCount = hist[m];
        predictedMove = m;
      }
    }

    return predictedMove;
  }

  getOptimalCounter(difficulty) {
    const moves = ['rock', 'paper', 'scissors'];
    const counters = { rock: 'paper', paper: 'scissors', scissors: 'rock' };

    if (difficulty === 'random') {
      return moves[Math.floor(Math.random() * 3)];
    }

    // Markov predictive counter:
    // With 75% probability, play the counter to what player is predicted to throw!
    // With 25% probability, play random to avoid being totally predictable
    if (Math.random() < 0.75) {
      const predictedPlayerMove = this.predictNextMove();
      return counters[predictedPlayerMove];
    } else {
      return moves[Math.floor(Math.random() * 3)];
    }
  }

  reset() {
    this.transitions = {};
    this.lastPlayerMove = null;
    this.lastOutcome = null;
  }
}

// Global Profile Sync
function recordRPSPlayed(isWin) {
  try {
    const raw = localStorage.getItem('randoo_arcade_profile');
    const profile = raw ? JSON.parse(raw) : { games: {} };
    if (!profile.games) profile.games = {};
    if (!profile.games.rps) profile.games.rps = { played: 0, wins: 0 };
    profile.games.rps.played++;
    if (isWin) profile.games.rps.wins++;
    profile.totalPlayed = (profile.totalPlayed || 0) + 1;
    if (isWin) profile.totalWins = (profile.totalWins || 0) + 1;
    localStorage.setItem('randoo_arcade_profile', JSON.stringify(profile));
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const audio = new RPSAudio();
  const confetti = new ConfettiEffect(document.getElementById('confettiCanvas'));
  const ai = new MarkovPredictor();

  // Elements
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const aiDifficulty = document.getElementById('aiDifficulty');
  const matchMode = document.getElementById('matchMode');
  const playerScoreEl = document.getElementById('playerScore');
  const cpuScoreEl = document.getElementById('cpuScore');
  const matchStatusText = document.getElementById('matchStatusText');
  const playerHandCard = document.getElementById('playerHandCard');
  const cpuHandCard = document.getElementById('cpuHandCard');
  const playerHandEmoji = document.getElementById('playerHandEmoji');
  const cpuHandEmoji = document.getElementById('cpuHandEmoji');
  const countdownText = document.getElementById('countdownText');
  const resultPill = document.getElementById('resultPill');
  const streakCount = document.getElementById('streakCount');
  const tiesCount = document.getElementById('tiesCount');
  const winRate = document.getElementById('winRate');
  const moveButtons = document.querySelectorAll('.move-btn');
  const resetMatchBtn = document.getElementById('resetMatchBtn');
  const cpuName = document.getElementById('cpuName');
  const matchOverBanner = document.getElementById('matchOverBanner');
  const mobBadge = document.getElementById('mobBadge');
  const mobTitle = document.getElementById('mobTitle');
  const mobDesc = document.getElementById('mobDesc');
  const mobPlayAgainBtn = document.getElementById('mobPlayAgainBtn');

  // Emojis dictionary
  const emojis = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️'
  };

  // Game State
  let playerScore = 0;
  let cpuScore = 0;
  let ties = 0;
  let currentStreak = 0;
  let totalRounds = 0;
  let isDueling = false;
  let isMatchOver = false;

  // Theme Button Handling
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  let currentTheme = localStorage.getItem('randoo_theme') || 'dark';

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('randoo_theme', theme);
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
      audio.playTick();
    });
  }

  // Sound UI
  function updateSoundUI() {
    soundIcon.textContent = audio.isMuted ? '🔇' : '🔊';
  }
  updateSoundUI();

  soundToggleBtn.addEventListener('click', () => {
    audio.toggleMute();
    updateSoundUI();
  });

  // Help Modal
  helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
  closeHelpBtn.addEventListener('click', () => helpModal.classList.add('hidden'));

  // Target wins for match
  function getTargetWins() {
    const mode = matchMode.value;
    if (mode === 'bo3') return 2;
    if (mode === 'bo5') return 3;
    return Infinity; // Endless
  }

  function updateStatusBanner() {
    const target = getTargetWins();
    if (target === Infinity) {
      matchStatusText.textContent = 'Endless Gauntlet';
    } else {
      matchStatusText.textContent = `First to ${target} Wins`;
    }
  }

  function updateStats() {
    playerScoreEl.textContent = playerScore;
    cpuScoreEl.textContent = cpuScore;
    streakCount.textContent = currentStreak;
    tiesCount.textContent = ties;

    const completed = playerScore + cpuScore;
    const rate = completed > 0 ? Math.round((playerScore / completed) * 100) : 0;
    winRate.textContent = `${rate}%`;
  }

  // Evaluate Round Result
  function evaluateWinner(player, cpu) {
    if (player === cpu) return 'tie';
    if (
      (player === 'rock' && cpu === 'scissors') ||
      (player === 'paper' && cpu === 'rock') ||
      (player === 'scissors' && cpu === 'paper')
    ) {
      return 'win';
    }
    return 'loss';
  }

  // Execute Duel Choreography
  function executeDuel(playerChoice) {
    if (isDueling || isMatchOver) return;
    isDueling = true;

    // Disable move buttons during duel
    moveButtons.forEach(b => b.disabled = true);

    // Compute CPU Choice
    const cpuChoice = ai.getOptimalCounter(aiDifficulty.value);

    // Reset visual cards
    playerHandCard.className = 'hand-card shaking-player';
    cpuHandCard.className = 'hand-card shaking-cpu';
    playerHandEmoji.textContent = '✊';
    cpuHandEmoji.textContent = '✊';

    resultPill.className = 'duel-result-pill';
    resultPill.textContent = 'Clashing...';

    // Countdown sequence (Rock... Paper... Scissors... Shoot!)
    const sequence = ['Rock!', 'Paper!', 'Scissors!', 'SHOOT!'];
    let step = 0;

    const timer = setInterval(() => {
      if (step < sequence.length) {
        countdownText.textContent = sequence[step];
        audio.playTick();
        step++;
      } else {
        clearInterval(timer);
        resolveDuel(playerChoice, cpuChoice);
      }
    }, 280);
  }

  function resolveDuel(playerChoice, cpuChoice) {
    playerHandCard.classList.remove('shaking-player');
    cpuHandCard.classList.remove('shaking-cpu');

    // Reveal choices
    playerHandEmoji.textContent = emojis[playerChoice];
    cpuHandEmoji.textContent = emojis[cpuChoice];

    const result = evaluateWinner(playerChoice, cpuChoice);
    totalRounds++;

    // Record to Markov AI
    ai.recordRound(playerChoice, result);

    if (result === 'win') {
      playerScore++;
      currentStreak++;
      playerHandCard.classList.add('win-highlight');
      cpuHandCard.classList.add('lose-highlight');
      resultPill.className = 'duel-result-pill win';
      resultPill.textContent = '🎉 You Won!';
      audio.playWin();
      recordRPSPlayed(true);

      if (currentStreak >= 3) confetti.burst(60);

    } else if (result === 'loss') {
      cpuScore++;
      currentStreak = 0;
      playerHandCard.classList.add('lose-highlight');
      cpuHandCard.classList.add('win-highlight');
      resultPill.className = 'duel-result-pill loss';
      resultPill.textContent = '💀 CPU Won!';
      audio.playLoss();
      recordRPSPlayed(false);

    } else {
      ties++;
      playerHandCard.classList.add('tie-highlight');
      cpuHandCard.classList.add('tie-highlight');
      resultPill.className = 'duel-result-pill tie';
      resultPill.textContent = "🤝 It's a Tie!";
      audio.playTie();
    }

    updateStats();

    // Check Match Completion in Best of 3 / Best of 5
    const target = getTargetWins();
    if (target !== Infinity && (playerScore >= target || cpuScore >= target)) {
      isMatchOver = true;
      const isPlayerWin = playerScore >= target;

      setTimeout(() => {
        if (isPlayerWin) {
          confetti.burst(120);
          audio.playWin();
          countdownText.textContent = '🏆 VICTORY!';
          resultPill.className = 'duel-result-pill win';
          resultPill.textContent = `🏆 Match Won (${playerScore} - ${cpuScore})`;
          matchStatusText.textContent = '🏆 Match Completed (You Won!)';

          if (matchOverBanner && mobBadge && mobTitle && mobDesc) {
            mobBadge.className = 'mob-badge win';
            mobBadge.textContent = '🏆 MATCH CHAMPION';
            mobTitle.textContent = 'Championship Victory!';
            mobDesc.textContent = `Spectacular! You defeated the ${cpuName.textContent} ${playerScore} to ${cpuScore} in ${matchMode.options[matchMode.selectedIndex].text}!`;
            matchOverBanner.style.display = 'block';
            matchOverBanner.className = 'match-over-banner win-banner';
          }
        } else {
          audio.playLoss();
          countdownText.textContent = '💀 DEFEAT!';
          resultPill.className = 'duel-result-pill loss';
          resultPill.textContent = `💀 Match Lost (${cpuScore} - ${playerScore})`;
          matchStatusText.textContent = '💀 Match Completed (CPU Won)';

          if (matchOverBanner && mobBadge && mobTitle && mobDesc) {
            mobBadge.className = 'mob-badge loss';
            mobBadge.textContent = '💀 MATCH DEFEATED';
            mobTitle.textContent = 'Match Defeat!';
            mobDesc.textContent = `The ${cpuName.textContent} defeated you ${cpuScore} to ${playerScore}. Ready for redemption?`;
            matchOverBanner.style.display = 'block';
            matchOverBanner.className = 'match-over-banner loss-banner';
          }
        }
      }, 350);

      isDueling = false;
      moveButtons.forEach(b => b.disabled = true);
      return;
    }

    isDueling = false;
    moveButtons.forEach(b => b.disabled = false);
  }

  // Handle Move Click
  moveButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const move = btn.getAttribute('data-move');
      executeDuel(move);
    });
  });

  // Reset Match
  function resetMatch() {
    isMatchOver = false;
    isDueling = false;
    playerScore = 0;
    cpuScore = 0;
    ties = 0;
    currentStreak = 0;
    updateStats();
    updateStatusBanner();

    playerHandCard.className = 'hand-card';
    cpuHandCard.className = 'hand-card';
    playerHandEmoji.textContent = '❔';
    cpuHandEmoji.textContent = '❔';

    countdownText.textContent = 'Ready!';
    resultPill.className = 'duel-result-pill';
    resultPill.textContent = 'Pick Your Move';

    if (matchOverBanner) {
      matchOverBanner.className = 'match-over-banner hidden';
      matchOverBanner.style.display = 'none';
    }
    moveButtons.forEach(b => b.disabled = false);
  }

  if (mobPlayAgainBtn) {
    mobPlayAgainBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (typeof audio.playPop === 'function') audio.playPop();
      } catch (err) {}
      resetMatch();
    });
  }

  resetMatchBtn.addEventListener('click', () => {
    resetMatch();
  });

  matchMode.addEventListener('change', () => {
    resetMatch();
  });

  aiDifficulty.addEventListener('change', () => {
    cpuName.textContent = aiDifficulty.value === 'markov' ? 'Smart AI' : 'Casual CPU';
    ai.reset();
  });

  // Initial State
  updateStatusBanner();
  updateStats();
});