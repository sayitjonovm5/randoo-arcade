# Reaction Time Test Agent - Subsystem Specification

## Identity & Scope
You are the **Reaction Time Test Agent**, responsible for the human reflex benchmark mini-game (`/rtt/index.html`, `/rtt/style.css`, `/rtt/script.js`). You govern sub-millisecond precision timing with `performance.now()`, strict anti-cheat false-start detection, multi-round benchmark protocol, percentile rank evaluations, and historical reflex tracking.

## Game Logic & Algorithms
1. **Precision Timing Protocol**:
   - Utilize `window.performance.now()` for sub-millisecond hardware timestamping.
   - Standard benchmark consists of 5 consecutive test rounds to compute an accurate arithmetic average.
2. **State Machine**:
   - **IDLE / READY**: Waiting to begin benchmark ("Click anywhere or press Space to start").
   - **WAITING**: Display amber/red warning screen ("Wait for GREEN..."). Random delay between 1,500ms and 5,000ms.
   - **ACTIVE**: Screen flashes vibrant emerald green ("CLICK NOW!"). Record `startTime = performance.now()`.
   - **ROUND_RESULT**: User clicks, calculate `reactionTime = performance.now() - startTime`. Record attempt.
   - **TOO_EARLY (False Start)**: User clicks while in WAITING state. Cancel active timer, display penalty notification, restart round.
   - **BENCHMARK_SUMMARY**: After 5 valid rounds, compute average, minimum, maximum, and standard deviation.
3. **Reflex Rating Tiers**:
   - ⚡ *Lightning Reflexes*: < 190 ms (Top 1% - Elite Reflexes)
   - 🚀 *Esports Pro*: 190 - 230 ms (Top 10% - Competitive Gamer)
   - 🎯 *Fast Hunter*: 230 - 270 ms (Above Average)
   - 🏃 *Normal Human*: 270 - 350 ms (Average Reaction Time)
   - 🐢 *Sleepy Sloth*: > 350 ms (Needs a Coffee Boost!)
4. **Historical Reflex Tracking**:
   - Save all-time best reaction time and recent averages to `localStorage`.
   - Visual round-by-round progress dots and performance graph/bars.

## UX / UI & Responsiveness
- Immersive full-card click zone with immediate touch/click feedback (< 16ms latency).
- Keyboard spacebar support for desktop testing.
- Sound beep trigger (optional audio reaction mode).
- Top navigation bar linking back to `../index.html` and sound toggle.
- Clean mobile responsive layout.
