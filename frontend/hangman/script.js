/**
 * HANGMAN QUEST - ADVANCED LEXICON & DUAL GALLOWS CONTROLLER
 */

// Sound Synthesizer Engine
class HangmanAudio {
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

  playCorrect() {
    this.playTone(523.25, 'sine', 0.12, 659.25);
  }

  playWrong() {
    this.playTone(280, 'sawtooth', 0.18, 160);
  }

  playWin() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.25), idx * 80);
      });
    } catch (e) {}
  }

  playLoss() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [380, 320, 260, 200];
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'sawtooth', 0.22), idx * 100);
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
    const colors = ['#00f2fe', '#4facfe', '#00e676', '#ffb300', '#ff3366', '#9d4edd', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
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
      p.vy += 0.32;
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

// Categorized Lexicon
const LEXICON = {
  animals: [
    { word: "ELEPHANT", hint: "Large mammal with a long trunk and tusks" },
    { word: "KANGAROO", hint: "Australian marsupial that hops on strong hind legs" },
    { word: "OCTOPUS", hint: "Eight-armed marine creature known for high intelligence" },
    { word: "CHAMELEON", hint: "Lizard capable of shifting its skin colors" },
    { word: "PENGUIN", hint: "Flightless aquatic bird living primarily in Antarctica" },
    { word: "DOLPHIN", hint: "Highly intelligent marine mammal that uses echolocation" },
    { word: "ALLIGATOR", hint: "Large predatory freshwater reptile with powerful jaws" },
    { word: "FLAMINGO", hint: "Tall pink wading bird that frequently stands on one leg" },
    { word: "PLATYPUS", hint: "Egg-laying semi-aquatic mammal with a duck-like bill" },
    { word: "CHEETAH", hint: "Fastest land animal on Earth" }
  ],
  tech: [
    { word: "ALGORITHM", hint: "Step-by-step computational procedure for solving problems" },
    { word: "JAVASCRIPT", hint: "Core programming language powering the interactive web" },
    { word: "COMPILER", hint: "Program that converts source code into machine instructions" },
    { word: "CYBERNETIC", hint: "Relating to computerized biological enhancement or control" },
    { word: "DATABASE", hint: "Structured set of data stored systematically in a computer" },
    { word: "ENCRYPTION", hint: "Converting information into secure code to prevent interception" },
    { word: "QUANTUM", hint: "Subatomic computing paradigm using qubits and superposition" },
    { word: "BLOCKCHAIN", hint: "Decentralized, immutable distributed ledger technology" },
    { word: "FIREWALL", hint: "Network security system that monitors and filters traffic" }
  ],
  food: [
    { word: "SPAGHETTI", hint: "Classic Italian long, thin cylindrical pasta" },
    { word: "CROISSANT", hint: "Buttery, flaky viennoiserie pastry shaped like a crescent" },
    { word: "CHOCOLATE", hint: "Sweet confectionery treat processed from cacao beans" },
    { word: "GUACAMOLE", hint: "Creamy dip originated in Mexico made from mashed avocados" },
    { word: "ESPRESSO", hint: "Concentrated coffee brewed by forcing pressurized hot water" },
    { word: "CHEESECAKE", hint: "Dessert consisting of sweetened soft cheese on a biscuit crust" },
    { word: "PINEAPPLE", hint: "Tropical fruit with tough segmented skin and spiky crown" }
  ],
  places: [
    { word: "PYRAMIDS", hint: "Ancient monumental stone tombs situated in Giza, Egypt" },
    { word: "MADAGASCAR", hint: "Island nation off the coast of East Africa with unique biodiversity" },
    { word: "WATERFALL", hint: "Cascading river dropping vertically over a cliff precipice" },
    { word: "HIMALAYAS", hint: "Mountain range separating the Indian subcontinent from the Tibetan Plateau" },
    { word: "ANTARCTICA", hint: "Earth's southernmost icy continent surrounding the South Pole" },
    { word: "COLOSSEUM", hint: "Iconic ancient amphitheatre in the heart of Rome" },
    { word: "AMAZON", hint: "World's largest tropical rainforest by drainage and biodiversity" }
  ],
  nature: [
    { word: "PHOTOSYNTHESIS", hint: "Process by which plants convert sunlight into chemical energy" },
    { word: "SUPERNOVA", hint: "Cataclysmic explosion of a massive dying star" },
    { word: "ATMOSPHERE", hint: "Protective envelope of gases surrounding our planet" },
    { word: "METEORITE", hint: "Piece of interplanetary debris that impacts Earth's surface" },
    { word: "LIGHTNING", hint: "Powerful electrostatic discharge between clouds and the ground" },
    { word: "GLACIER", hint: "Massive, persistent body of dense flowing ice" },
    { word: "ECOSYSTEM", hint: "Biological community of interacting organisms and their environment" }
  ]
};

// Global Profile Updater
function recordHangmanPlayed(isWin) {
  try {
    const raw = localStorage.getItem('randoo_arcade_profile');
    const profile = raw ? JSON.parse(raw) : { games: {} };
    if (!profile.games) profile.games = {};
    if (!profile.games.hangman) profile.games.hangman = { played: 0, wins: 0 };
    profile.games.hangman.played++;
    if (isWin) profile.games.hangman.wins++;
    profile.totalPlayed = (profile.totalPlayed || 0) + 1;
    if (isWin) profile.totalWins = (profile.totalWins || 0) + 1;
    localStorage.setItem('randoo_arcade_profile', JSON.stringify(profile));
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const audio = new HangmanAudio();
  const confetti = new ConfettiEffect(document.getElementById('confettiCanvas'));

  // Elements
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const categorySelect = document.getElementById('categorySelect');
  const streakCount = document.getElementById('streakCount');
  const livesCount = document.getElementById('livesCount');
  const classicStageImg = document.getElementById('classicStageImg');
  const categoryTag = document.getElementById('categoryTag');
  const hintText = document.getElementById('hintText');
  const revealHintBtn = document.getElementById('revealHintBtn');
  const vowelTokenBtn = document.getElementById('vowelTokenBtn');
  const tokenCount = document.getElementById('tokenCount');
  const wordDisplay = document.getElementById('wordDisplay');
  const keyboardContainer = document.getElementById('keyboardContainer');
  const restartBtn = document.getElementById('restartBtn');

  // Modal elements
  const resultModal = document.getElementById('resultModal');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const solutionWord = document.getElementById('solutionWord');
  const modalStreak = document.getElementById('modalStreak');
  const modalErrors = document.getElementById('modalErrors');
  const modalNextBtn = document.getElementById('modalNextBtn');

  // SVG Body Parts (indexed 0 to 5)
  const svgBodyParts = [
    document.getElementById('partHead'),
    document.getElementById('partBody'),
    document.getElementById('partArmL'),
    document.getElementById('partArmR'),
    document.getElementById('partLegL'),
    document.getElementById('partLegR')
  ];

  // Game State
  const MAX_LIVES = 6;
  let currentWord = '';
  let currentHint = '';
  let guessedLetters = new Set();
  let remainingLives = MAX_LIVES;
  let vowelTokens = 1;
  let streak = 0;
  let gameOver = false;

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
      audio.playCorrect();
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

  // Get active word list
  function getWordPool() {
    const cat = categorySelect.value;
    if (cat === 'all') {
      return Object.values(LEXICON).flat();
    }
    return LEXICON[cat] || LEXICON.animals;
  }

  // Start new round
  function startNewRound() {
    const pool = getWordPool();
    const item = pool[Math.floor(Math.random() * pool.length)];

    currentWord = item.word.toUpperCase();
    currentHint = item.hint;
    guessedLetters.clear();
    remainingLives = MAX_LIVES;
    vowelTokens = 1;
    gameOver = false;

    // Reset UI
    livesCount.textContent = remainingLives;
    tokenCount.textContent = vowelTokens;
    vowelTokenBtn.disabled = false;
    hintText.textContent = 'Click "Reveal Clue" if you need a hint.';
    revealHintBtn.disabled = false;

    // Update Category Tag
    const catLabels = {
      animals: '🐾 Animals',
      tech: '💻 Tech & Science',
      food: '🍕 Food & Dining',
      places: '🌍 World & Places',
      nature: '🌿 Nature & Space'
    };
    categoryTag.textContent = catLabels[categorySelect.value] || '🌟 Mixed Quest';

    // Reset SVG parts
    svgBodyParts.forEach(part => part.classList.add('hidden-part'));
    classicStageImg.src = '1.png';

    renderWordSlots();
    renderKeyboard();
    resultModal.classList.add('hidden');
  }

  // Render secret word slots
  function renderWordSlots() {
    wordDisplay.innerHTML = '';
    currentWord.split('').forEach(char => {
      const slot = document.createElement('div');
      slot.className = 'letter-slot';

      if (char === ' ') {
        slot.classList.add('space');
        slot.textContent = ' ';
      } else if (guessedLetters.has(char)) {
        slot.classList.add('filled');
        slot.textContent = char;
      } else {
        slot.textContent = '';
      }
      wordDisplay.appendChild(slot);
    });
  }

  // Render on-screen keyboard
  function renderKeyboard() {
    keyboardContainer.innerHTML = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    letters.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'key-btn';
      btn.textContent = letter;
      btn.setAttribute('data-letter', letter);

      if (guessedLetters.has(letter)) {
        btn.disabled = true;
        if (currentWord.includes(letter)) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
        }
      }

      btn.addEventListener('click', () => handleGuessLetter(letter));
      keyboardContainer.appendChild(btn);
    });
  }

  // Handle letter guess
  function handleGuessLetter(letter) {
    if (gameOver || guessedLetters.has(letter)) return;

    guessedLetters.add(letter);

    if (currentWord.includes(letter)) {
      audio.playCorrect();
      renderWordSlots();
      updateKeyboardKey(letter, true);
      checkWinCondition();
    } else {
      audio.playWrong();
      remainingLives--;
      livesCount.textContent = remainingLives;
      updateKeyboardKey(letter, false);
      updateGallowsGraphic();
      checkLossCondition();
    }
  }

  function updateKeyboardKey(letter, isCorrect) {
    const btn = keyboardContainer.querySelector(`[data-letter="${letter}"]`);
    if (btn) {
      btn.disabled = true;
      btn.classList.add(isCorrect ? 'correct' : 'wrong');
    }
  }

  function updateGallowsGraphic() {
    const errorIndex = MAX_LIVES - remainingLives - 1;
    if (errorIndex >= 0 && errorIndex < svgBodyParts.length) {
      svgBodyParts[errorIndex].classList.remove('hidden-part');
    }
    const stageNum = Math.min(6, MAX_LIVES - remainingLives + 1);
    classicStageImg.src = `${stageNum}.png`;
  }

  function checkWinCondition() {
    const allFound = currentWord.split('').every(char => char === ' ' || guessedLetters.has(char));
    if (allFound) {
      gameOver = true;
      streak++;
      streakCount.textContent = streak;
      audio.playWin();
      confetti.burst(90);
      recordHangmanPlayed(true);

      setTimeout(() => {
        modalIcon.textContent = '🎉';
        modalTitle.textContent = 'Victorious!';
        modalDesc.textContent = 'Awesome detective work! You guessed all letters.';
        solutionWord.textContent = currentWord;
        modalStreak.textContent = streak;
        modalErrors.textContent = MAX_LIVES - remainingLives;
        resultModal.classList.remove('hidden');
      }, 500);
    }
  }

  function checkLossCondition() {
    if (remainingLives <= 0) {
      gameOver = true;
      streak = 0;
      streakCount.textContent = '0';
      audio.playLoss();
      recordHangmanPlayed(false);

      setTimeout(() => {
        modalIcon.textContent = '💀';
        modalTitle.textContent = 'Gallows Fell!';
        modalDesc.textContent = 'Out of lives! Better luck on the next mystery word.';
        solutionWord.textContent = currentWord;
        modalStreak.textContent = '0';
        modalErrors.textContent = MAX_LIVES;
        resultModal.classList.remove('hidden');
      }, 500);
    }
  }

  // Physical Keyboard Listener
  window.addEventListener('keydown', (e) => {
    if (gameOver || !resultModal.classList.contains('hidden') || !helpModal.classList.contains('hidden')) {
      return;
    }
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
      handleGuessLetter(key);
    }
  });

  // Hints
  revealHintBtn.addEventListener('click', () => {
    hintText.textContent = `💡 Clue: ${currentHint}`;
    revealHintBtn.disabled = true;
  });

  vowelTokenBtn.addEventListener('click', () => {
    if (vowelTokens <= 0 || gameOver) return;
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const unrevealedVowels = vowels.filter(v => currentWord.includes(v) && !guessedLetters.has(v));

    if (unrevealedVowels.length > 0) {
      const chosen = unrevealedVowels[Math.floor(Math.random() * unrevealedVowels.length)];
      vowelTokens--;
      tokenCount.textContent = vowelTokens;
      vowelTokenBtn.disabled = true;
      handleGuessLetter(chosen);
    } else {
      hintText.textContent = 'ℹ️ No hidden vowels remain in this word!';
      audio.playWrong();
    }
  });

  // Category switch
  categorySelect.addEventListener('change', () => {
    startNewRound();
  });

  // Buttons
  restartBtn.addEventListener('click', startNewRound);
  modalNextBtn.addEventListener('click', startNewRound);

  // Initialize
  startNewRound();
});