/**
 * NUMBER RANGE GUESSER - ADVANCED ALGORITHM & RADAR CONTROLLER
 */

class SoundEngine {
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

  playTone(freq, type = 'sine', duration = 0.12, endFreq = null) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playGuessFeedback(isHigher) {
    if (isHigher) {
      // Too high: tone drops
      this.playTone(620, 'triangle', 0.18, 380);
    } else {
      // Too low: tone climbs
      this.playTone(380, 'triangle', 0.18, 620);
    }
  }

  playVictory() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.28);
        }, i * 90);
      });
    } catch (e) {}
  }
}

// Confetti Particle System
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

  burst(count = 80) {
    const colors = ['#00f2fe', '#4facfe', '#00e676', '#ffb300', '#ff3366', '#9d4edd', '#ffffff'];
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
      p.vy += 0.35; // gravity
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

// Global Stats Sync Helper
function recordGuessGamePlayed(isWin) {
  try {
    const raw = localStorage.getItem('randoo_arcade_profile');
    const profile = raw ? JSON.parse(raw) : { games: {} };
    if (!profile.games) profile.games = {};
    if (!profile.games.guess) profile.games.guess = { played: 0, wins: 0 };
    profile.games.guess.played++;
    if (isWin) profile.games.guess.wins++;
    profile.totalPlayed = (profile.totalPlayed || 0) + 1;
    if (isWin) profile.totalWins = (profile.totalWins || 0) + 1;
    localStorage.setItem('randoo_arcade_profile', JSON.stringify(profile));
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const sound = new SoundEngine();
  const confetti = new ConfettiEffect(document.getElementById('confettiCanvas'));

  // Elements
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const diffButtons = document.querySelectorAll('.diff-btn');
  const promptHeading = document.getElementById('promptHeading');
  const secretBox = document.getElementById('secretBox');
  const boxContent = document.getElementById('boxContent');

  // Range visualizer elements
  const rangeMinEl = document.getElementById('rangeMin');
  const rangeMaxEl = document.getElementById('rangeMax');
  const rangeZoneEl = document.getElementById('rangeZone');
  const rangeBarActive = document.getElementById('rangeBarActive');
  const rangeMarkerGuess = document.getElementById('rangeMarkerGuess');

  // Thermal elements
  const thermalStatus = document.getElementById('thermalStatus');
  const thermalBar = document.getElementById('thermalBar');

  // Form & inputs
  const guessForm = document.getElementById('guessForm');
  const guessInput = document.getElementById('guessInput');
  const submitBtn = document.getElementById('submitBtn');
  const answerEl = document.getElementById('answer');

  // Hints
  const hintOptimalBtn = document.getElementById('hintOptimalBtn');
  const hintMidpoint = document.getElementById('hintMidpoint');
  const hintEvenOddBtn = document.getElementById('hintEvenOddBtn');

  // Stats
  const attemptsCount = document.getElementById('attemptsCount');
  const targetTries = document.getElementById('targetTries');
  const sessionWins = document.getElementById('sessionWins');
  const historyChips = document.getElementById('historyChips');
  const restartBtn = document.getElementById('restartBtn');

  // Game State
  let globalMin = 1;
  let globalMax = 50;
  let currentMin = 1;
  let currentMax = 50;
  let parTries = 6;
  let secret = 0;
  let attempts = 0;
  let wins = 0;
  let gameOver = false;
  let guessHistory = [];

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
      sound.playTone(520, 'sine', 0.1);
    });
  }

  // Sound UI
  function updateSoundUI() {
    soundIcon.textContent = sound.isMuted ? '🔇' : '🔊';
  }
  updateSoundUI();

  soundToggleBtn.addEventListener('click', () => {
    sound.toggleMute();
    updateSoundUI();
  });

  // Modal
  helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
  closeHelpBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.classList.add('hidden');
  });

  // Init New Round
  function initGame() {
    secret = Math.floor(Math.random() * (globalMax - globalMin + 1)) + globalMin;
    currentMin = globalMin;
    currentMax = globalMax;
    attempts = 0;
    gameOver = false;
    guessHistory = [];

    promptHeading.textContent = `I'm thinking of a number between ${globalMin} and ${globalMax}`;
    rangeMinEl.textContent = globalMin;
    rangeMaxEl.textContent = globalMax;
    targetTries.textContent = parTries;
    attemptsCount.textContent = '0';

    secretBox.classList.remove('revealed');
    boxContent.textContent = '?';

    guessInput.value = '';
    guessInput.disabled = false;
    submitBtn.disabled = false;
    guessInput.focus();

    answerEl.className = 'feedback-message';
    answerEl.textContent = 'Awaiting your guess...';

    thermalStatus.textContent = 'Make your first guess!';
    thermalBar.style.width = '0%';
    thermalBar.style.background = 'linear-gradient(90deg, #4facfe, #ffb300, #ff3366)';

    rangeMarkerGuess.style.display = 'none';
    hintEvenOddBtn.innerHTML = '🎲 Reveal Even/Odd';
    hintEvenOddBtn.disabled = false;
    updateRangeBar();
    updateMidpointHint();
    renderHistory();
  }

  function updateRangeBar() {
    rangeZoneEl.textContent = `Active Range: ${currentMin} — ${currentMax}`;
    const totalRange = globalMax - globalMin;
    const leftPercent = ((currentMin - globalMin) / totalRange) * 100;
    const widthPercent = ((currentMax - currentMin) / totalRange) * 100;

    rangeBarActive.style.left = `${Math.max(0, leftPercent)}%`;
    rangeBarActive.style.width = `${Math.min(100, Math.max(2, widthPercent))}%`;
  }

  function updateMidpointHint() {
    const mid = Math.floor((currentMin + currentMax) / 2);
    hintMidpoint.textContent = mid;
  }

  function updateThermalRadar(guess) {
    const totalRange = globalMax - globalMin;
    const diff = Math.abs(guess - secret);
    const closenessRatio = Math.max(0, 1 - (diff / (totalRange * 0.4)));
    const percent = Math.min(100, Math.max(5, closenessRatio * 100));

    thermalBar.style.width = `${percent}%`;

    if (diff === 0) {
      thermalStatus.textContent = '🎯 Bullseye! Exact Match!';
      thermalBar.style.background = 'var(--accent-green)';
    } else if (diff <= Math.max(2, Math.floor(totalRange * 0.04))) {
      thermalStatus.textContent = '🔥 BOILING HOT! Extremely close!';
      thermalBar.style.background = '#ff0055';
    } else if (diff <= Math.max(4, Math.floor(totalRange * 0.12))) {
      thermalStatus.textContent = '🌡️ Very Warm! You are right around it!';
      thermalBar.style.background = '#ff9900';
    } else if (diff <= Math.floor(totalRange * 0.28)) {
      thermalStatus.textContent = '❄️ Lukewarm to Cold.';
      thermalBar.style.background = '#00f2fe';
    } else {
      thermalStatus.textContent = '🧊 Freezing Cold! Far off.';
      thermalBar.style.background = '#3a86ff';
    }
  }

  function renderHistory() {
    if (guessHistory.length === 0) {
      historyChips.innerHTML = '<span class="no-history-hint">No guesses yet</span>';
      return;
    }

    historyChips.innerHTML = guessHistory.map(item => {
      let icon = item.type === 'low' ? '▲' : item.type === 'high' ? '▼' : '★';
      return `<span class="history-chip ${item.type}">${item.val} ${icon}</span>`;
    }).join('');
  }

  // Handle Guess Submission
  function handleGuess() {
    if (gameOver) return;

    const val = parseInt(guessInput.value, 10);
    if (isNaN(val)) {
      answerEl.className = 'feedback-message';
      answerEl.textContent = 'Please enter a valid whole number.';
      return;
    }

    if (val < globalMin || val > globalMax) {
      answerEl.className = 'feedback-message';
      answerEl.textContent = `Number must be between ${globalMin} and ${globalMax}!`;
      return;
    }

    attempts++;
    attemptsCount.textContent = attempts;
    updateThermalRadar(val);

    // Update Range Marker
    const totalRange = globalMax - globalMin;
    const markerPercent = ((val - globalMin) / totalRange) * 100;
    rangeMarkerGuess.style.display = 'block';
    rangeMarkerGuess.style.left = `${Math.min(100, Math.max(0, markerPercent))}%`;

    if (val === secret) {
      // Victory!
      gameOver = true;
      wins++;
      sessionWins.textContent = wins;
      guessInput.disabled = true;
      submitBtn.disabled = true;

      secretBox.classList.add('revealed');
      boxContent.textContent = secret;

      let compliment = attempts <= parTries ? '🌟 Genius Binary Search!' : '🎉 Well Done!';
      answerEl.className = 'feedback-message correct';
      answerEl.textContent = `${compliment} You discovered the secret ${secret} in ${attempts} tries!`;

      guessHistory.push({ val, type: 'correct' });
      renderHistory();

      sound.playVictory();
      confetti.burst(100);
      recordGuessGamePlayed(true);

    } else if (val < secret) {
      // Too Low
      if (val >= currentMin) currentMin = val + 1;
      answerEl.className = 'feedback-message too-low';
      answerEl.textContent = `Too low! Try higher than ${val}`;
      guessHistory.push({ val, type: 'low' });
      sound.playGuessFeedback(false);
      updateRangeBar();
      updateMidpointHint();
      renderHistory();
      guessInput.value = '';
      guessInput.focus();

    } else {
      // Too High
      if (val <= currentMax) currentMax = val - 1;
      answerEl.className = 'feedback-message too-high';
      answerEl.textContent = `Too high! Try lower than ${val}`;
      guessHistory.push({ val, type: 'high' });
      sound.playGuessFeedback(true);
      updateRangeBar();
      updateMidpointHint();
      renderHistory();
      guessInput.value = '';
      guessInput.focus();
    }
  }

  // Form Submit
  guessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGuess();
  });

  submitBtn.addEventListener('click', handleGuess);

  // Difficulty Selector
  diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      diffButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      globalMin = parseInt(btn.dataset.min, 10);
      globalMax = parseInt(btn.dataset.max, 10);
      parTries = parseInt(btn.dataset.maxTries, 10);
      initGame();
    });
  });

  // Hint: Midpoint Autofill
  hintOptimalBtn.addEventListener('click', () => {
    if (gameOver) return;
    const mid = Math.floor((currentMin + currentMax) / 2);
    guessInput.value = mid;
    guessInput.focus();
  });

  // Hint: Even/Odd
  hintEvenOddBtn.addEventListener('click', () => {
    if (gameOver) return;
    const isEven = secret % 2 === 0;
    hintEvenOddBtn.innerHTML = `🎲 Secret is <strong>${isEven ? 'EVEN' : 'ODD'}</strong>`;
    hintEvenOddBtn.disabled = true;
    answer.textContent = `💡 Clue: Secret number is ${isEven ? 'EVEN' : 'ODD'}!`;
    answer.className = 'feedback-message';
    audio.playPop();
  });

  // Restart Round
  restartBtn.addEventListener('click', () => {
    initGame();
  });

  // Initial Run
  initGame();
});
