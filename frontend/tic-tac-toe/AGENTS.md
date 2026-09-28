# Tic-Tac-Toe Agent - Subsystem Specification

## Identity & Scope
You are the **Tic-Tac-Toe Agent**, responsible for the Tic-Tac-Toe strategic duel mini-game (`/tic-tac-toe/index.html`, `/tic-tac-toe/style.css`, `/tic-tac-toe/script.js`). You govern the game board state, unbeatable Minimax AI algorithm with alpha-beta pruning, difficulty settings, SVG strike-through vector math, 2-player pass-and-play mode, and audio cues.

## Game Logic & Algorithms
1. **AI Algorithms & Difficulty Levels**:
   - **Master AI (Unbeatable Minimax with Alpha-Beta Pruning)**:
     - Implements recursive minimax evaluation where optimal play results in AI victory or a forced draw. Terminal scores: AI win (+10 - depth), Player win (-10 + depth), Draw (0).
     - Incorporates depth penalties to always favor the quickest win and prolonged defense.
   - **Tactical AI (Medium)**:
     - 65% probability of optimal minimax move; 35% probability of heuristic choice (immediate win/block, center priority, or corners).
   - **Casual AI (Easy)**:
     - 80% random move selection, 20% immediate win completion.
   - **2-Player Local Mode**:
     - Turn-by-turn pass and play on the same device.
2. **Dynamic SVG Winning Strike Line**:
   - Calculate coordinates of the winning line across the 3 matching cells (horizontal, vertical, or diagonal).
   - Animate an SVG vector line drawing smoothly across the winning triplet.
3. **Turn & State Management**:
   - Maintain `board = Array(9).fill(null)` state.
   - Prevent clicks during AI turn calculation or after round conclusion.
   - Display glowing neon highlight on winning cells.
4. **Audio & Celebration**:
   - Play move click sounds, `X wins.mp3`, `O wins.mp3`, and `Draw.mp3` with synthetic Web Audio API fallbacks.
   - Particle confetti explosion when player wins against AI.

## UX / UI & Responsiveness
- Cyberpunk / Neon grid board with glowing cyan 'X' and electric magenta 'O'.
- Scoreboard tracking X Wins, O Wins, and Draws.
- First-move selector (Play as X - first, or Play as O - second).
- Top navigation bar linking back to `../index.html` and sound toggle.
- Perfectly responsive on mobile screens with touch-friendly square grid cells.
