# PS09 – Adaptive Memory Matching Game

> **Problem ID:** PS09
> **Name:** Manish Kumar
> **Roll Number:** 2311981318
> **Branch:** BE-CSE

---

## What It Is

A 4×4 memory-matching card game in the browser. Flip pairs of cards. A match stays open. A mismatch flips back. Find all 8 pairs to win. After each round, the next round's difficulty is automatically adjusted based on how many moves you used — and the reason is shown on screen.

---

## Install and Run (Windows)

```cmd
:: 1. Clone or download the project
cd C:\path\to\memory-matching

:: 2. Install dependencies
npm install

:: 3. Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Run Tests

```cmd
npm test
```

Expected output (all tests pass):

```
✓ tests/gameLogic.test.js  (16 tests)
✓ tests/storage.test.js    (7 tests)
✓ tests/components.test.jsx (3 tests)
```

---

## Build for Production

```cmd
npm run build
```

Output goes to the `dist/` folder. Open `dist/index.html` or deploy to Azure (see `docs/azure-hosting.md`).

---

## How to Play

1. Click any card to flip it face-up.
2. Click a second card — if the symbols match, both stay open.
3. If they don't match, they flip back after a short delay.
4. Find all 8 pairs to win. The game shows your moves, matched pairs, and elapsed time.
5. After winning, the adaptive rule tells you what level comes next and why.

---

## The Seed Feature

Every game has a **seed** — a number that controls the card shuffle. The same seed always gives the same layout, so games are repeatable.

- The seed is shown in the status bar.
- To use a specific seed: `http://localhost:5173/?seed=42`
- If no seed is in the URL, a random one is generated.

This is useful for demos, screenshots, and automated tests.

---

## Adaptive Difficulty Rule

A perfect game (8 pairs, no mistakes) takes exactly **8 moves**.

| Moves used | Result |
|---|---|
| ≤ 12 | Next level goes **UP** one step |
| 13 – 19 | **Same** level |
| ≥ 20 | Next level goes **DOWN** one step |

Levels in order: **Easy** (1.5 s flip-back) → **Medium** (1.0 s) → **Hard** (0.6 s).

The thresholds (`goodGame: 12`, `badGame: 20`) live in one object in `src/gameLogic.js` and can be changed in one place.

---

## Restart Safety Explanation

When two cards don't match, a `setTimeout` is started to flip them back.
If the player presses **Restart** while that timer is still counting down, two things happen:

1. `clearTimeout(timeoutRef.current)` cancels the timer immediately.
2. Every game has a `gameId` (a number stored in a `useRef`). When the timer fires, it checks whether the current `gameId` still matches the one captured when the timer started. If not, it returns without changing anything.

This double-lock means a stale timer from an old game can **never** corrupt a new game's cards, even in edge cases.

---

## Demo Script (Repeatable with `?seed=42`)

Use URL: `http://localhost:5173/?seed=42`

With seed 42, the card layout is always:

```
Position: 0  1  2  3
          4  5  6  7
          8  9  10 11
          12 13 14 15
```

### Screenshot 1 – A Match
> Click card **0**, then card **X** where X has the same symbol as card 0.
> Expected: both cards stay open, `Pairs: 1/8`.

*[Screenshot placeholder: two matching cards face-up, pairs counter incremented]*

### Screenshot 2 – A Mismatch
> Click two cards you know won't match (e.g. card **1** then card **3** if different).
> Expected: both cards face-up briefly, then flip back after the delay.

*[Screenshot placeholder: two mismatched cards facing up with a slight highlight]*

### Screenshot 3 – Rapid Clicks Ignored
> Click two mismatched cards, then rapidly click a third card before they flip back.
> Expected: the third card does NOT flip. The board is locked until the delay ends.

*[Screenshot placeholder: third click does nothing, board still showing two open cards]*

### Screenshot 4 – Restart During Pending Timer
> Click two mismatched cards to start the flip-back timer.
> Immediately press **Restart** before the timer expires.
> Expected: all 16 cards reset to face-down instantly. The old timer fires silently and changes nothing.

*[Screenshot placeholder: all cards face-down immediately after restart]*

### Screenshot 5 – Difficulty Change with Reason
> Complete a game in ≤ 12 moves on Easy.
> Expected: win screen shows "Finished in N moves (12 or fewer), so next round is Medium."

*[Screenshot placeholder: win screen with adaptive reason text visible]*

---

## File Layout

```
src/
  gameLogic.js    All pure game-rule functions (no React)
  storage.js      localStorage wrapper (try/catch)
  App.jsx         State + timers + layout
  Card.jsx        One card <button>
  App.css         All styles
tests/
  gameLogic.test.js
  storage.test.js
  components.test.jsx
  setup.js
docs/
  azure-hosting.md
.github/workflows/
  ci.yml
```

---

## Requirements Checklist

| Requirement | File / Test |
|---|---|
| Seeded RNG (mulberry32) | `gameLogic.js` → `seededRandom` |
| Fisher-Yates shuffle | `gameLogic.js` → `shuffle` |
| ?seed= URL param | `App.jsx` → `getSeedFromUrl` |
| Seed shown on screen | `App.jsx` status bar |
| Matching logic | `gameLogic.js` → `flipCard` |
| Win screen with stats | `App.jsx` win-screen section |
| Locked state (no 3rd flip) | `gameLogic.js` → `flipCard` guard; `gameLogic.test.js` |
| Ignore same-card double-click | `gameLogic.js` → `flipCard`; `gameLogic.test.js` |
| Ignore matched card click | `gameLogic.js` → `flipCard`; `gameLogic.test.js` |
| Ignore clicks after win | `gameLogic.js` → `flipCard`; `gameLogic.test.js` |
| Moves / pairs / elapsed time | `App.jsx` state + interval |
| Timer starts on first flip | `App.jsx` `useEffect` on status |
| Timer stops on win | `App.jsx` `useEffect` on status |
| Tab-hidden timer pause | `App.jsx` visibilitychange listener |
| LEVELS config object | `gameLogic.js` |
| Adaptive rule | `gameLogic.js` → `getNextLevel`; `gameLogic.test.js` |
| THRESHOLDS config object | `gameLogic.js` |
| Reason text on win screen | `App.jsx` win screen; `components.test.jsx` |
| localStorage save/load | `storage.js`; `storage.test.js` |
| Last 5 results shown | `App.jsx` history section |
| Clear history button | `App.jsx`; `storage.js` |
| try/catch localStorage | `storage.js`; `storage.test.js` |
| Restart button | `App.jsx` |
| How to play section | `App.jsx` |
| Restart cancels timer | `App.jsx` `handleRestart`; `components.test.jsx` |
| gameId stale-timer guard | `App.jsx` `gameIdRef`; `components.test.jsx` |
| `<button>` cards (accessible) | `Card.jsx` |
| aria-label on cards | `Card.jsx` |
| Emoji card faces | `gameLogic.js` SYMBOLS |
| README with demo script | `README.md` |

---

## Limitations

- No backend — results are browser-local only. Clearing browser data clears history.
- The timer counts whole seconds (not milliseconds) for display simplicity.
- No animations beyond CSS transitions.
- Tests cover logic thoroughly; visual/pixel tests are out of scope.


