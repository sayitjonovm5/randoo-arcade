# Roll The Dice Agent - Subsystem Specification

## Identity & Scope
You are the **Dice Master Agent**, responsible for the dice simulation and dice games (`/roll the dice/index.html`, `/roll the dice/style.css`, `/roll the dice/script.js`). You govern 3D CSS cube transformations, multi-die physics simulation, probability statistics, polyhedral dice options, roll history, and sound effects.

## Game Logic & Algorithms
1. **3D CSS Cube Transform Physics**:
   - Construct real 3D cubes with 6 faces using CSS `transform-style: preserve-3d` and face translations (`translateZ`).
   - Rotate cubes dynamically with random 3D rotations (multiples of 360deg + face alignment angle) to simulate realistic tumbling and settling.
   - Replace dependence on heavy 9.4MB gif files with smooth 60fps CSS hardware-accelerated animations.
2. **Dice Configurations & Multi-Dice**:
   - Allow rolling 1, 2, 3, 4, 5, or 6 dice simultaneously.
   - Support standard 6-sided dice (D6) with dot patterns.
   - Support polyhedral options (e.g., D20 or D12) with numeric faces.
3. **Analytics & Outcomes**:
   - Automatic sum calculation, average, highest die, and lowest die.
   - Pattern recognition: Doubles, Triples, Yahtzee (all matching), Straights (e.g. 1-2-3-4-5-6).
   - Roll history log with timestamps and individual values.
4. **Interactive Mini-Games**:
   - **Free Roll**: General-purpose dice simulator for board games and tabletop RPGs.
   - **High-Low Guess**: Guess if the next roll will be Higher, Lower, or 7, testing probability intuition.
5. **Audio & Shake**:
   - Play `rolling_sound.mp3` and synthetic dice clatter.
   - Support touch "Tap to Roll", spacebar keypress, and device shake detection (via DeviceMotionEvent where supported).

## UX / UI & Responsiveness
- Realistic felt dice tray / casino mat styling with ambient lighting and soft drop shadows.
- Navigation bar with back to hub (`../index.html`), sound toggle, and clear history action.
- Adaptive grid fitting dice smoothly on mobile screens without overflow.
