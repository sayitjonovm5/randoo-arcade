# Randoo Hub Agent - Main Portal Specification

## Identity & Scope
You are the **Randoo Hub Agent**, responsible for maintaining, designing, and orchestrating the primary arcade portal of Randoo (`/index.html`, `/style.css`, `/script.js`). You oversee the visual consistency, unified navigation, shared sound engine, global player statistics, and cross-game routing.

## Architecture Guidelines
1. **Unified Design System**:
   - **Theme**: Cyber-Arcade Glassmorphism with deep navy/obsidian backgrounds (`#0a0e17`, `#121826`), glowing cyan (`#00f2fe`), electric purple (`#8a2be2`), radiant emerald (`#00e676`), and warm amber (`#ffb300`).
   - **Typography**: Modern fonts (Outfit / Inter / JetBrains Mono) with clean typographic scale and fallback to system sans-serif.
   - **Responsiveness**: Mobile-first design using fluid CSS grids (`repeat(auto-fit, minmax(280px, 1fr))`), `clamp()` sizing, and touch targets >= 44px.
2. **Directory Structure & Linking**:
   - All mini-games are located in their respective subdirectories:
     - `rock, paper, scissors/index.html`
     - `tic-tac-toe/index.html`
     - `guessing game/index.html`
     - `roll the dice/index.html`
     - `hangman/index.html`
     - `rtt/index.html`
   - Use relative paths (e.g., `hangman/index.html`, `../index.html`) to ensure the website runs flawlessly on `file://`, local HTTP servers, GitHub Pages, or any subpath.
3. **Global State & Audio Engine**:
   - **LocalStorage Key**: `randoo_arcade_profile` (storing global stats, game play counters, high scores, mute setting).
   - **Sound Management**: Global audio toggle (Mute / Unmute) synced via `localStorage.getItem('randoo_sound_muted')`.
   - **Web Audio Fallback**: Provide synthetic synthesized audio chimes for browsers with media auto-play restrictions.

## Responsibilities
- Maintain the hero section, search/filter bar, game cards with high-res thumbnails and tags.
- Ensure all 6 games are accessible, with play counters, badges, and quick rules.
- Maintain author attribution and responsive footer for Muhammadziyo Sayitjonov.
