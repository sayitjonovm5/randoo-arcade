/**
 * 3D DICE SIMULATOR - 3D CSS CUBE PHYSICS & ANALYTICS CONTROLLER
 */

class DiceAudio {
  constructor() {
    this.isMuted = localStorage.getItem('randoo_sound_muted') === 'true';
    this.ctx = null;
    this.audioRoll = new Audio('rolling_sound.mp3');
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

  playRoll() {
    if (this.isMuted) return;
    this.audioRoll.currentTime = 0;
    this.audioRoll.play().catch(() => {
      // Synthetic dice clatter noise bursts
      this.playSyntheticClatter();
    });
  }

  playSyntheticClatter() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(150 + Math.random() * 400, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.05);
        }, i * 60);
      }
    } catch (e) {}
  }

  playFanfare() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.2);
        }, idx * 75);
      });
    } catch (e) {}
  }
}

// Confetti System
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

  burst(count = 70) {
    const colors = ['#00f2fe', '#4facfe', '#00e676', '#ffb300', '#ff3366', '#ffffff'];
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

// Global Profile Sync
function recordDicePlayed() {
  try {
    const raw = localStorage.getItem('randoo_arcade_profile');
    const profile = raw ? JSON.parse(raw) : { games: {} };
    if (!profile.games) profile.games = {};
    if (!profile.games.dice) profile.games.dice = { played: 0, wins: 0 };
    profile.games.dice.played++;
    localStorage.setItem('randoo_arcade_profile', JSON.stringify(profile));
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const audio = new DiceAudio();
  const confetti = new ConfettiEffect(document.getElementById('confettiCanvas'));

  // Elements
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const diceCountSelect = document.getElementById('diceCountSelect');
  const gameModeSelect = document.getElementById('gameModeSelect');
  const predictionBar = document.getElementById('predictionBar');
  const predictBtns = document.querySelectorAll('.predict-btn');
  const predictStreakEl = document.getElementById('predictStreak');
  const diceContainer = document.getElementById('diceContainer');
  const totalSumEl = document.getElementById('totalSum');
  const averageValEl = document.getElementById('averageVal');
  const highestValEl = document.getElementById('highestVal');
  const patternBadge = document.getElementById('patternBadge');
  const rollBtn = document.getElementById('rollBtn');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Game State
  let diceCount = 2;
  let isRolling = false;
  let diceValues = [1, 1];
  let previousSum = null;
  let currentPrediction = null;
  let predictionStreak = 0;
  let historyLog = [];

  // Face rotation map: face number -> [rotX, rotY]
  const faceRotations = {
    1: [0, 0],
    2: [90, 0],
    3: [0, -90],
    4: [0, 90],
    5: [-90, 0],
    6: [0, 180]
  };

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
      audio.playSyntheticClatter();
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

  // Render 3D Cubes DOM
  function renderDiceCubes() {
    diceContainer.innerHTML = '';
    for (let i = 0; i < diceCount; i++) {
      const cube = document.createElement('div');
      cube.className = 'dice-cube';
      cube.id = `cube-${i}`;

      // 6 Faces
      for (let f = 1; f <= 6; f++) {
        const face = document.createElement('div');
        face.className = `dice-face face-${f}`;
        // Create pips for this face
        const pipCount = f;
        for (let p = 0; p < pipCount; p++) {
          const pip = document.createElement('div');
          pip.className = 'pip';
          face.appendChild(pip);
        }
        cube.appendChild(face);
      }
      diceContainer.appendChild(cube);
    }
  }

  // Roll All Dice with 3D Physics
  function rollDice() {
    if (isRolling) return;
    isRolling = true;
    rollBtn.disabled = true;

    audio.playRoll();
    recordDicePlayed();

    patternBadge.classList.add('hidden');

    const newValues = [];
    const cubes = diceContainer.querySelectorAll('.dice-cube');

    cubes.forEach((cube, index) => {
      const result = Math.floor(Math.random() * 6) + 1;
      newValues.push(result);

      // Calculate 3D target rotation with multiple full spins
      const baseAngles = faceRotations[result];
      const extraSpinX = (Math.floor(Math.random() * 3) + 2) * 360;
      const extraSpinY = (Math.floor(Math.random() * 3) + 2) * 360;

      const targetX = baseAngles[0] + extraSpinX;
      const targetY = baseAngles[1] + extraSpinY;

      cube.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;
    });

    // Settle after animation completes (1000ms)
    setTimeout(() => {
      diceValues = newValues;
      const sum = diceValues.reduce((a, b) => a + b, 0);
      const avg = (sum / diceCount).toFixed(1);
      const highest = Math.max(...diceValues);

      totalSumEl.textContent = sum;
      averageValEl.textContent = avg;
      highestValEl.textContent = highest;

      // Pattern Recognition
      evaluatePatterns(diceValues);

      // Prediction Mode Evaluation
      if (gameModeSelect.value === 'highlow') {
        evaluatePrediction(sum);
      }
      previousSum = sum;

      // Append to History Log
      addHistoryItem(diceValues, sum);

      isRolling = false;
      rollBtn.disabled = false;
    }, 1050);
  }

  // Check Patterns (Doubles, Triples, Yahtzee, Straights)
  function evaluatePatterns(values) {
    if (values.length < 2) return;

    const counts = {};
    values.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const maxCount = Math.max(...Object.values(counts));

    if (maxCount === values.length && values.length >= 2) {
      patternBadge.textContent = values.length >= 5 ? '🏆 YAHTZEE! All Matching!' : '✨ All Matching!';
      patternBadge.classList.remove('hidden');
      audio.playFanfare();
      confetti.burst(80);
    } else if (maxCount >= 3) {
      patternBadge.textContent = '🔥 Triples or More!';
      patternBadge.classList.remove('hidden');
      audio.playFanfare();
    } else if (maxCount === 2) {
      patternBadge.textContent = '🎲 Doubles!';
      patternBadge.classList.remove('hidden');
    }
  }

  // Evaluate High-Low Prediction
  function evaluatePrediction(newSum) {
    if (previousSum === null || !currentPrediction) return;

    let success = false;
    if (currentPrediction === 'higher' && newSum > previousSum) success = true;
    else if (currentPrediction === 'lower' && newSum < previousSum) success = true;
    else if (currentPrediction === 'exact' && newSum === previousSum) success = true;

    if (success) {
      predictionStreak++;
      predictStreakEl.textContent = predictionStreak;
      audio.playFanfare();
      if (predictionStreak >= 3) confetti.burst(60);
    } else {
      predictionStreak = 0;
      predictStreakEl.textContent = '0';
    }

    // Reset prediction selection for next roll
    predictBtns.forEach(b => b.classList.remove('active'));
    currentPrediction = null;
  }

  // Add History Item
  function addHistoryItem(values, sum) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const item = { time, values: [...values], sum };
    historyLog.unshift(item);
    if (historyLog.length > 20) historyLog.pop();
    renderHistory();
  }

  function renderHistory() {
    if (historyLog.length === 0) {
      historyList.innerHTML = '<div class="history-empty">No rolls recorded yet. Press Roll!</div>';
      return;
    }

    historyList.innerHTML = historyLog.map(h => {
      const diceBreakdown = h.values.join(' + ');
      return `
        <div class="history-item">
          <span>${h.time} &bull; [ ${diceBreakdown} ]</span>
          <strong>Sum: ${h.sum}</strong>
        </div>
      `;
    }).join('');
  }

  // Event Listeners
  rollBtn.addEventListener('click', rollDice);

  // Spacebar to roll
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && helpModal.classList.contains('hidden')) {
      e.preventDefault();
      rollDice();
    }
  });

  // Number of dice select
  diceCountSelect.addEventListener('change', () => {
    diceCount = parseInt(diceCountSelect.value, 10);
    previousSum = null;
    totalSumEl.textContent = '--';
    averageValEl.textContent = '--';
    highestValEl.textContent = '--';
    renderDiceCubes();
  });

  // Mode Switch
  gameModeSelect.addEventListener('change', () => {
    if (gameModeSelect.value === 'highlow') {
      predictionBar.classList.remove('hidden');
    } else {
      predictionBar.classList.add('hidden');
    }
  });

  // Prediction Buttons
  predictBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      predictBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPrediction = btn.getAttribute('data-predict');
    });
  });

  // Clear History
  clearHistoryBtn.addEventListener('click', () => {
    historyLog = [];
    renderHistory();
  });

  // Initialize
  renderDiceCubes();
});