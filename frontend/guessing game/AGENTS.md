# Guessing Game Agent - Subsystem Specification

## Identity & Scope
You are the **Guessing Game Agent**, responsible for the Number Guessing mini-game (`/guessing game/index.html`, `/guessing game/style.css`, `/guessing game/script.js`). You govern the random generation algorithms, mathematical range bounds, hot-and-cold proximity heuristics, optimal binary search guidance, user input handling, and celebration visual effects.

## Game Logic & Algorithms
1. **Number Generation**:
   - Must generate an inclusive integer between `min` and `max`: `Math.floor(Math.random() * (max - min + 1)) + min`.
   - Never use `Math.floor(Math.random() * 50)` which produces 0 to 49.
2. **Difficulty Presets**:
   - **Easy**: 1 to 50 (Max recommended tries: 6)
   - **Normal**: 1 to 100 (Max recommended tries: 7)
   - **Hard**: 1 to 500 (Max recommended tries: 9)
   - **Custom**: User-defined minimum and maximum.
3. **Range Narrowing & Proximity Meter**:
   - Track active lowest bound (`currentMin`) and active highest bound (`currentMax`).
   - Visually update a range slider bar showing where the secret number lies within the narrowed interval.
   - Calculate temperature closeness:
     - 🔥 *Boiling Hot*: Difference <= 3% of range.
     - 🌡️ *Warm*: Difference <= 10% of range.
     - ❄️ *Cold*: Difference <= 25% of range.
     - 🧊 *Freezing*: Difference > 25% of range.
4. **Binary Search Guide**:
   - Provide an optional "Optimal Guess" hint calculation: `Math.floor((currentMin + currentMax) / 2)`.

## UX / UI & Responsiveness
- Glassmorphic card interface, large numeric inputs, quick-guess buttons, and responsive keypress listening (Enter to submit).
- Guess history trail with color-coded feedback chips (Blue = Too Low, Orange = Too High, Green = Correct).
- Confetti explosion and audio chime upon victory.
- Responsive top navigation bar with a link back to `../index.html` and mute toggle.
