/**
 * REACTION TIME TEST - PRECISION BENCHMARK & PERCENTILE ENGINE
 */

// Sound Synthesizer
class RTTAudio {
  constructor() {
    this.isMuted = localStorage.getItem('randoo_sound_muted') === 'true';
    this.ctx = null;
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

  playBeep() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playEarlyBuzz() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
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
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.25);
        }, idx * 80);
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

  burst(count = 80) {
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

// Global Profile Sync — SAVES RELIABLY ON EVERY SINGLE ATTEMPT AND BENCHMARK
function saveRTTScore(scoreMs, isFullBenchmark = false) {
  try {
    const raw = localStorage.getItem('randoo_arcade_profile');
    const profile = raw ? JSON.parse(raw) : { games: {} };
    if (!profile.games) profile.games = {};
    if (!profile.games.rtt) profile.games.rtt = { played: 0, bestMs: null };

    // Increment played counters
    profile.games.rtt.played = (profile.games.rtt.played || 0) + 1;

    // Check personal best (lower ms is better!)
    const currentBest = profile.games.rtt.bestMs;
    const rounded = Math.round(scoreMs);

    if (rounded > 50) { // filter out impossible sub-50ms glitches
      if (!currentBest || rounded < currentBest) {
        profile.games.rtt.bestMs = rounded;
      }
      if (!profile.bestReactionMs || rounded < profile.bestReactionMs) {
        profile.bestReactionMs = rounded;
      }
    }

    localStorage.setItem('randoo_arcade_profile', JSON.stringify(profile));
    return profile;
  } catch (e) {
    console.error("Failed to save RTT score:", e);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Theme Sync from LocalStorage
  const savedTheme = localStorage.getItem('randoo_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const audio = new RTTAudio();
  const confetti = new ConfettiEffect(document.getElementById('confettiCanvas'));

  // Elements
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const roundIndicator = document.getElementById('roundIndicator');
  const roundDots = document.querySelectorAll('.round-dot');
  const reactionZone = document.getElementById('reactionZone');
  const zoneIcon = document.getElementById('zoneIcon');
  const zoneHeadline = document.getElementById('zoneHeadline');
  const zoneSubtext = document.getElementById('zoneSubtext');
  const zoneMetric = document.getElementById('zoneMetric');
  const metricVal = document.getElementById('metricVal');

  // Summary Elements
  const summaryCard = document.getElementById('summaryCard');
  const rankEmoji = document.getElementById('rankEmoji');
  const rankTitle = document.getElementById('rankTitle');
  const rankDesc = document.getElementById('rankDesc');
  const summaryAverage = document.getElementById('summaryAverage');
  const summaryBest = document.getElementById('summaryBest');
  const summaryConsistency = document.getElementById('summaryConsistency');
  const retryBenchmarkBtn = document.getElementById('retryBenchmarkBtn');

  // All-time stats
  const statAllTimeBest = document.getElementById('statAllTimeBest');
  const statTestsCompleted = document.getElementById('statTestsCompleted');

  // State Machine: 'idle' | 'waiting' | 'active' | 'result' | 'early' | 'summary'
  let currentState = 'idle';
  let roundIndex = 0; // 0 to 4
  const TOTAL_ROUNDS = 5;
  let roundScores = [];
  let timerId = null;
  let startTime = 0;

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
      audio.playBeep();
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

  // Load and Render All-Time Stats in Real Time
  function loadAllTimeStats() {
    try {
      const raw = localStorage.getItem('randoo_arcade_profile');
      if (raw) {
        const profile = JSON.parse(raw);
        const best = profile.games?.rtt?.bestMs || profile.bestReactionMs;
        if (best) {
          statAllTimeBest.textContent = `${Math.round(best)} ms`;
        } else {
          statAllTimeBest.textContent = `-- ms`;
        }
        if (profile.games?.rtt?.played) {
          statTestsCompleted.textContent = profile.games.rtt.played;
        }
      }
    } catch (e) {}
  }
  loadAllTimeStats();

  // Reset Progress Dots
  function updateDots() {
    roundDots.forEach((dot, idx) => {
      dot.className = 'round-dot';
      if (idx < roundScores.length) {
        dot.classList.add('completed');
      } else if (idx === roundIndex) {
        dot.classList.add('active');
      }
    });
    roundIndicator.textContent = `Round ${roundIndex + 1} of ${TOTAL_ROUNDS}`;
  }

  // Set Zone State
  function setZoneState(state, customData = {}) {
    currentState = state;
    reactionZone.className = `reaction-zone state-${state}`;

    if (state === 'idle') {
      zoneIcon.textContent = '⚡';
      zoneHeadline.textContent = 'Click To Start';
      zoneSubtext.textContent = 'When the red screen flashes green, click as fast as you can!';
      zoneMetric.classList.add('hidden');
    } else if (state === 'waiting') {
      zoneIcon.textContent = '🛑';
      zoneHeadline.textContent = 'Wait For Green...';
      zoneSubtext.textContent = 'Do not click yet! Hold your finger ready.';
      zoneMetric.classList.add('hidden');
    } else if (state === 'active') {
      zoneIcon.textContent = '🟢';
      zoneHeadline.textContent = 'CLICK NOW!';
      zoneSubtext.textContent = 'Tap as fast as you can!';
      zoneMetric.classList.add('hidden');
      audio.playBeep();
    } else if (state === 'early') {
      zoneIcon.textContent = '⚠️';
      zoneHeadline.textContent = 'Too Early!';
      zoneSubtext.textContent = 'False start detected. Click here to retry this round.';
      zoneMetric.classList.add('hidden');
      audio.playEarlyBuzz();
    } else if (state === 'result') {
      zoneIcon.textContent = '⏱️';
      zoneHeadline.textContent = 'Round Complete';
      zoneSubtext.textContent = roundIndex < TOTAL_ROUNDS - 1 ? 'Click to proceed to next round ▶' : 'Click to view final benchmark scorecard ▶';
      zoneMetric.classList.remove('hidden');
      metricVal.textContent = Math.round(customData.ms);
    }
  }

  // Start Next Round
  function startRound() {
    setZoneState('waiting');
    // Random delay between 1.5s and 4.5s
    const randomDelay = Math.floor(Math.random() * 3000) + 1500;

    timerId = setTimeout(() => {
      startTime = window.performance.now();
      setZoneState('active');
    }, randomDelay);
  }

  // Handle User Click / Tap on Zone
  function handleZoneInteraction() {
    if (currentState === 'idle') {
      startRound();
    } else if (currentState === 'waiting') {
      // Clicked too early!
      clearTimeout(timerId);
      setZoneState('early');
    } else if (currentState === 'early') {
      // Retry round
      startRound();
    } else if (currentState === 'active') {
      // Valid reaction!
      const endTime = window.performance.now();
      const reactionTime = endTime - startTime;

      roundScores.push(reactionTime);
      updateDots();
      setZoneState('result', { ms: reactionTime });

      // IMMEDIATELY SAVE SCORE ON EVERY VALID REACTION!
      saveRTTScore(reactionTime, false);
      loadAllTimeStats();

    } else if (currentState === 'result') {
      roundIndex++;
      if (roundIndex < TOTAL_ROUNDS) {
        updateDots();
        startRound();
      } else {
        showFinalSummary();
      }
    }
  }

  // Evaluate Tier Ranking
  function evaluateTier(avg) {
    if (avg < 195) {
      return {
        emoji: '⚡',
        title: 'Lightning Reflexes',
        desc: 'Top 1% — World-class Neurological Reaction Speed'
      };
    } else if (avg < 235) {
      return {
        emoji: '🚀',
        title: 'Esports Pro Tier',
        desc: 'Top 10% — Competitive Gamer Reflex Threshold'
      };
    } else if (avg < 275) {
      return {
        emoji: '🎯',
        title: 'Fast Hunter Tier',
        desc: 'Top 25% — Significantly faster than normal average'
      };
    } else if (avg < 350) {
      return {
        emoji: '🏃',
        title: 'Normal Human Reflexes',
        desc: 'Average Human Response Time (250ms - 350ms)'
      };
    } else {
      return {
        emoji: '🐢',
        title: 'Sleepy Sloth Tier',
        desc: 'A bit sluggish today! Grab an espresso and re-try.'
      };
    }
  }

  // Show Final Summary
  function showFinalSummary() {
    reactionZone.classList.add('hidden');
    summaryCard.classList.remove('hidden');

    const avg = roundScores.reduce((a, b) => a + b, 0) / TOTAL_ROUNDS;
    const best = Math.min(...roundScores);

    // Consistency (standard deviation)
    const variance = roundScores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / TOTAL_ROUNDS;
    const stdDev = Math.sqrt(variance);
    let consistencyRating = stdDev < 20 ? '🌟 Highly Consistent' : stdDev < 45 ? '👍 Solid Consistency' : '⚡ Variable';

    const tier = evaluateTier(avg);
    rankEmoji.textContent = tier.emoji;
    rankTitle.textContent = tier.title;
    rankDesc.textContent = tier.desc;

    summaryAverage.textContent = `${Math.round(avg)} ms`;
    summaryBest.textContent = `${Math.round(best)} ms`;
    summaryConsistency.textContent = consistencyRating;

    audio.playFanfare();
    confetti.burst(90);

    // Save final benchmark completion
    saveRTTScore(best, true);
    loadAllTimeStats();
  }

  // Reset Full Benchmark
  function resetBenchmark() {
    roundIndex = 0;
    roundScores = [];
    summaryCard.classList.add('hidden');
    reactionZone.classList.remove('hidden');
    updateDots();
    setZoneState('idle');
  }

  reactionZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handleZoneInteraction();
  });

  retryBenchmarkBtn.addEventListener('click', resetBenchmark);

  // Keyboard Spacebar listener
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && helpModal.classList.contains('hidden')) {
      e.preventDefault();
      handleZoneInteraction();
    }
  });

  // Init
  updateDots();
  setZoneState('idle');
});
