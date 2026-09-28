# Hangman Agent - Subsystem Specification

## Identity & Scope
You are the **Hangman Agent**, responsible for the Hangman word guessing mini-game (`/hangman/index.html`, `/hangman/styles.css`, `/hangman/script.js`). You govern the lexicon database, category taxonomy, letter matching engine, hint tokens, dual gallows renderer (SVG vector + stage images), victory/defeat states, and accessibility/keyboard handling.

## Game Logic & Algorithms
1. **Lexicon & Categorization**:
   - Curated dictionaries with hints across 6 categories:
     - 🐾 *Animals*
     - 💻 *Tech & Computing*
     - 🍕 *Food & Dining*
     - 🌍 *Geography & Places*
     - 🔬 *Science & Nature*
     - 🎬 *Entertainment & Arts*
   - Support difficulty levels affecting max lives (Casual: 8 lives, Standard: 6 lives, Hardcore: 5 lives).
2. **Dual Gallows Rendering**:
   - Support both the classic PNG stages (`1.png` to `6.png`) AND modern crisp animated SVG vector illustrations so the game looks sharp on Retina/4K displays.
   - Smooth transition and body part appearance animation upon wrong guesses.
3. **Interactive Controls**:
   - Full physical keyboard listener (A-Z keys, Enter to restart, Space for hint).
   - On-screen touch keyboard with responsive grid layout (QWERTY or Alphabetical option), showing letter states: Default, Correct (Green), Incorrect (Strikethrough/Red/Disabled).
4. **Hint Engine**:
   - Clue text displayed on demand.
   - Hint tokens allowing players to reveal a random remaining vowel without penalty.
5. **Score & Streak Tracking**:
   - Maintain win streaks, games played, and letters guessed accuracy in `localStorage`.

## UX / UI & Responsiveness
- Do NOT turn the entire page body green or red on game finish. Use a sleek victory/defeat overlay modal with celebration effects, word definitions, and a quick "Play Next Word" action.
- Top bar with back to hub (`../index.html`), sound toggle, category picker, and live streak badge.
- Fully responsive across mobile touchscreens and desktop screens.
