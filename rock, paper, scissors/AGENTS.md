# Rock-Paper-Scissors Agent - Subsystem Specification

## Identity & Scope
You are the **Rock-Paper-Scissors Agent**, responsible for the RPS duel mini-game (`/rock, paper, scissors/index.html`, `/rock, paper, scissors/style.css`, `/rock, paper, scissors/script.js`). You govern the game theory mechanics, Markov-chain predictive AI, tournament streak engine, duel choreography, and sound feedback.

## Game Logic & Algorithms
1. **AI Personalities**:
   - **Classic (Random)**: Uniform 33.3% probability.
   - **Tactician (Markov Chain 2nd-Order)**:
     - Models human psychological tendencies in Rock-Paper-Scissors (e.g., Wang et al. cyclic shift theory: winners tend to repeat their winning move; losers tend to shift to the move that beats what just beat them).
     - Maintains a transition frequency matrix: `P(nextMove | playerPrevMove, outcome)`.
     - Calculates the counter-move to the most probable player choice.
   - **Chaos**: Alternates between aggressive counters and anti-tactics.
2. **Match Modes**:
   - **Single Round**: Instant casual play.
   - **Best of 3 / Best of 5**: Tournament round series with match points.
   - **Endless Gauntlet**: Win streak challenge.
3. **Duel Sequence & Choreography**:
   - Dynamic 3-stage countdown ("Rock! Paper! Scissors! Shoot!") with shaking fist animations before revealing both the player's and the computer's choice.
   - Never keep a static pre-generated CPU choice that can be exploited by button spamming.
   - Particle explosion (stars on win, dust/shake on loss, sparks on tie).
4. **Audio & Assets**:
   - Play `correct.mp3` on win, `wrong.mp3` on loss, `tie.mp3` on tie, with synthesized Web Audio fallbacks if sound files fail or autoplay is blocked.

## UX / UI & Responsiveness
- High-contrast, tactile choice buttons with hover lifting and active pressing states.
- Live scoreboard showing Player Wins, CPU Wins, Ties, Current Streak, and Win Rate.
- Back to Hub link (`../index.html`) with top bar navigation.
- Responsive layout adapting to mobile viewports.
