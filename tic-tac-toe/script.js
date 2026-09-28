/**
 * TIC-TAC-TOE NEON - UNBEATABLE MINIMAX AI & SVG STRIKE ENGINE
 */

class TTTAudio {
  constructor() {
    this.isMuted = localStorage.getItem('randoo_sound_muted') === 'true';
    this.ctx = null;
    this.audioXWins = new Audio('x wins.mp3');
    this.audioOWins = new Audio('o wins.mp3');
    this.audioDraw = new Audio('draw.mp3');
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

  playMove(isX) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isX ? 580 : 720, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playXWin() {
    if (this.isMuted) return;
    this.audioXWins.currentTime = 0;
    this.audioXWins.play().catch(() => this.synthFanfare());
  }

  playOWin() {
    if (this.isMuted) return;
    this.audioOWins.currentTime = 0;
    this.audioOWins.play().catch(() => this.synthFanfare());
  }

  playDraw() {
    if (this.isMuted) return;
    this.audioDraw.currentTime = 0;
    this.audioDraw.play().catch(() => {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      } catch (e) {}
    });
  }

  synthFanfare() {
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
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.25);
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

  burst(count = 75) {
    const colors = ['#00f2fe', '#ff007f', '#00e676', '#ffb300', '#ffffff'];
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
function recordTTTPlayed(isPlayerWin) {
  try {
    const raw = localStorage.getItem('randoo_arcade_profile');
    const profile = raw ? JSON.parse(raw) : { games: {} };
    if (!profile.games) profile.games = {};
    if (!profile.games.ttt) profile.games.ttt = { played: 0, wins: 0 };
    profile.games.ttt.played++;
    if (isPlayerWin) profile.games.ttt.wins++;
    profile.totalPlayed = (profile.totalPlayed || 0) + 1;
    if (isPlayerWin) profile.totalWins = (profile.totalWins || 0) + 1;
    localStorage.setItem('randoo_arcade_profile', JSON.stringify(profile));
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const audio = new TTTAudio();
  const confetti = new ConfettiEffect(document.getElementById('confettiCanvas'));

  // Elements
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const opponentSelect = document.getElementById('opponentSelect');
  const playerSymbolSelect = document.getElementById('playerSymbolSelect');
  const scoreXEl = document.getElementById('scoreX');
  const scoreDrawsEl = document.getElementById('scoreDraws');
  const scoreOEl = document.getElementById('scoreO');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const cells = document.querySelectorAll('.cell');
  const winningLine = document.getElementById('winningLine');
  const resBtn = document.getElementById('resBtn');

  // Winning Triplets & SVG Coordinates (300 x 300 viewBox)
  const WIN_COMBOS = [
    { combo: [0, 1, 2], line: { x1: 25, y1: 50, x2: 275, y2: 50 } },     // Row 0
    { combo: [3, 4, 5], line: { x1: 25, y1: 150, x2: 275, y2: 150 } },   // Row 1
    { combo: [6, 7, 8], line: { x1: 25, y1: 250, x2: 275, y2: 250 } },   // Row 2
    { combo: [0, 3, 6], line: { x1: 50, y1: 25, x2: 50, y2: 275 } },     // Col 0
    { combo: [1, 4, 7], line: { x1: 150, y1: 25, x2: 150, y2: 275 } },   // Col 1
    { combo: [2, 5, 8], line: { x1: 250, y1: 25, x2: 250, y2: 275 } },   // Col 2
    { combo: [0, 4, 8], line: { x1: 30, y1: 30, x2: 270, y2: 270 } },     // Diagonal \
    { combo: [2, 4, 6], line: { x1: 270, y1: 30, x2: 30, y2: 270 } }      // Diagonal /
  ];

  // Game State
  let board = Array(9).fill(null);
  let currentPlayer = 'X';
  let humanSymbol = 'X';
  let aiSymbol = 'O';
  let isGameOver = false;
  let scoreX = 0;
  let scoreO = 0;
  let scoreDraws = 0;

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
      audio.playMove(true);
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

  // Initialize Game Board
  function startNewGame() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    humanSymbol = playerSymbolSelect.value;
    aiSymbol = humanSymbol === 'X' ? 'O' : 'X';
    isGameOver = false;

    winningLine.classList.add('hidden');

    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
      cell.disabled = false;
    });

    updateTurnDisplay();

    // If AI is X, AI moves first!
    if (opponentSelect.value !== 'pvp' && currentPlayer === aiSymbol) {
      setTimeout(makeAiMove, 450);
    }
  }

  function updateTurnDisplay() {
    if (isGameOver) return;
    statusIcon.textContent = currentPlayer === 'X' ? '⚡' : '🌟';
    if (opponentSelect.value === 'pvp') {
      statusText.textContent = `Player ${currentPlayer}'s Turn`;
    } else {
      statusText.textContent = currentPlayer === humanSymbol ? `Your Turn (${humanSymbol})` : `AI Thinking... (${aiSymbol})`;
    }
  }

  // Check Board Winner helper
  function checkWinnerState(b) {
    for (const item of WIN_COMBOS) {
      const [c1, c2, c3] = item.combo;
      if (b[c1] && b[c1] === b[c2] && b[c1] === b[c3]) {
        return { winner: b[c1], winCombo: item };
      }
    }
    if (b.every(cell => cell !== null)) {
      return { winner: 'draw' };
    }
    return null;
  }

  // Handle Cell Click
  function handleCellClick(index) {
    if (isGameOver || board[index] !== null) return;
    if (opponentSelect.value !== 'pvp' && currentPlayer !== humanSymbol) return;

    makeMove(index, currentPlayer);

    const winInfo = checkWinnerState(board);
    if (winInfo) {
      finishGame(winInfo);
    } else {
      switchTurn();
      if (opponentSelect.value !== 'pvp' && !isGameOver && currentPlayer === aiSymbol) {
        setTimeout(makeAiMove, 400);
      }
    }
  }

  function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player === 'X' ? 'cell-x' : 'cell-o');
    audio.playMove(player === 'X');
  }

  function switchTurn() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnDisplay();
  }

  // Finish Game (Win / Draw)
  function finishGame(winInfo) {
    isGameOver = true;
    cells.forEach(c => c.disabled = true);

    if (winInfo.winner === 'draw') {
      scoreDraws++;
      scoreDrawsEl.textContent = scoreDraws;
      statusIcon.textContent = '🤝';
      statusText.textContent = "It's a Draw!";
      audio.playDraw();
      recordTTTPlayed(false);
      return;
    }

    const winner = winInfo.winner;
    if (winner === 'X') {
      scoreX++;
      scoreXEl.textContent = scoreX;
      audio.playXWin();
    } else {
      scoreO++;
      scoreOEl.textContent = scoreO;
      audio.playOWin();
    }

    // Highlight winning cells
    winInfo.winCombo.combo.forEach(idx => {
      cells[idx].classList.add('winning-cell');
    });

    // Draw Animated SVG Line
    const { x1, y1, x2, y2 } = winInfo.winCombo.line;
    winningLine.setAttribute('x1', x1);
    winningLine.setAttribute('y1', y1);
    winningLine.setAttribute('x2', x2);
    winningLine.setAttribute('y2', y2);
    winningLine.classList.remove('hidden');

    // Status text
    if (opponentSelect.value === 'pvp') {
      statusIcon.textContent = '👑';
      statusText.textContent = `Player ${winner} Wins!`;
    } else if (winner === humanSymbol) {
      statusIcon.textContent = '🎉';
      statusText.textContent = 'You Defeated The AI!';
      confetti.burst(90);
      recordTTTPlayed(true);
    } else {
      statusIcon.textContent = '💀';
      statusText.textContent = 'AI Took The Match!';
      recordTTTPlayed(false);
    }
  }

  // AI Logic: Master (Minimax), Medium (Tactical), Easy (Casual)
  function makeAiMove() {
    if (isGameOver) return;
    const mode = opponentSelect.value;
    let chosenIndex = null;

    if (mode === 'easy') {
      // 80% random, 20% block
      if (Math.random() < 0.2) {
        chosenIndex = findWinningOrBlockingMove(humanSymbol) || getRandomEmptyIndex();
      } else {
        chosenIndex = getRandomEmptyIndex();
      }
    } else if (mode === 'medium') {
      // 65% Minimax, 35% Tactical heuristic
      if (Math.random() < 0.65) {
        chosenIndex = getBestMinimaxMove();
      } else {
        chosenIndex = findWinningOrBlockingMove(aiSymbol) ||
                      findWinningOrBlockingMove(humanSymbol) ||
                      (board[4] === null ? 4 : getRandomEmptyIndex());
      }
    } else {
      // Master: 100% Unbeatable Minimax
      chosenIndex = getBestMinimaxMove();
    }

    if (chosenIndex !== null && board[chosenIndex] === null) {
      makeMove(chosenIndex, aiSymbol);
      const winInfo = checkWinnerState(board);
      if (winInfo) {
        finishGame(winInfo);
      } else {
        switchTurn();
      }
    }
  }

  function getRandomEmptyIndex() {
    const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
    if (emptyIndices.length === 0) return null;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  function findWinningOrBlockingMove(symbol) {
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = symbol;
        const state = checkWinnerState(board);
        board[i] = null;
        if (state && state.winner === symbol) return i;
      }
    }
    return null;
  }

  // RECURSIVE MINIMAX ALGORITHM WITH DEPTH PENALTIES
  function getBestMinimaxMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiSymbol;
        const score = minimax(board, 0, false, -Infinity, Infinity);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove !== null ? bestMove : getRandomEmptyIndex();
  }

  function minimax(currentBoard, depth, isMaximizing, alpha, beta) {
    const result = checkWinnerState(currentBoard);
    if (result) {
      if (result.winner === aiSymbol) return 10 - depth;
      if (result.winner === humanSymbol) return depth - 10;
      if (result.winner === 'draw') return 0;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = aiSymbol;
          const evaluation = minimax(currentBoard, depth + 1, false, alpha, beta);
          currentBoard[i] = null;
          maxEval = Math.max(maxEval, evaluation);
          alpha = Math.max(alpha, evaluation);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = humanSymbol;
          const evaluation = minimax(currentBoard, depth + 1, true, alpha, beta);
          currentBoard[i] = null;
          minEval = Math.min(minEval, evaluation);
          beta = Math.min(beta, evaluation);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  }

  // Cell Click Listeners
  cells.forEach(cell => {
    const idx = parseInt(cell.getAttribute('data-index'), 10);
    cell.addEventListener('click', () => handleCellClick(idx));
  });

  // Controls Listeners
  resBtn.addEventListener('click', startNewGame);

  opponentSelect.addEventListener('change', () => {
    scoreX = 0;
    scoreO = 0;
    scoreDraws = 0;
    scoreXEl.textContent = '0';
    scoreOEl.textContent = '0';
    scoreDrawsEl.textContent = '0';
    startNewGame();
  });

  playerSymbolSelect.addEventListener('change', () => {
    startNewGame();
  });

  // Initial Run
  startNewGame();
});