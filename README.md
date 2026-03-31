# 2 Player NES Tetris

A faithful browser-based recreation of the original NES Tetris with 1-player and 2-player support. Built from the actual [NES Tetris disassembly](https://github.com/CelestialAmber/TetrisNESDisasm) for accuracy.

## Features

- **NES-accurate gameplay** — gravity table, DAS (16-frame initial / 6-frame repeat), scoring, piece rotations, and RNG all match the original ROM
- **10 NES color palettes** — extracted from the actual PPU palette data, cycling every 10 levels
- **1-player and 2-player modes** — full split-screen with independent boards, scoring, and levels
- **Korobeiniki music** — chiptune rendition via Web Audio API (square + triangle wave)
- **NES-style visuals** — brick/stone background, bordered UI panels, 3D-shaded blocks, game over curtain animation
- **Level select** — start at any level from 0 to 9

## Controls

### 1 Player
| Action | Key |
|--------|-----|
| Move left/right | Arrow Left / Right |
| Soft drop | Arrow Down |
| Rotate clockwise | Arrow Up |
| Rotate counter-clockwise | N |
| Pause | Escape |

### 2 Player
| Action | P1 (left screen) | P2 (right screen) |
|--------|-------------------|-------------------|
| Move left/right | A / D | Arrow Left / Right |
| Soft drop | S | Arrow Down |
| Rotate clockwise | W | Arrow Up |
| Rotate counter-clockwise | Left Shift | N |
| Pause (both) | Escape | Escape |

## Setup

No build tools or dependencies required. Just a browser.

### Option 1: Open directly
Open `index.html` in any modern browser.

### Option 2: Local server
```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .
```
Then visit `http://localhost:8080`.

### Option 3: GitHub Pages
Enable GitHub Pages in your repo settings (Settings > Pages > Source: main branch) and access it at `https://<username>.github.io/2playerNEStetris/`.

## Scoring

Matches the original NES Tetris formula:

| Lines cleared | Base points |
|---------------|-------------|
| 1 (Single) | 40 |
| 2 (Double) | 100 |
| 3 (Triple) | 300 |
| 4 (Tetris) | 1200 |

Final score = base points x (level + 1). Soft drop awards 1 point per cell dropped.

## Project Structure

```
index.html   — game page (loads tetris.js)
tetris.js    — all game logic, rendering, and audio
palettes/    — custom color palette sprite sheets
```

## Technical Details

- Canvas: 768x720 (NES 256x240 scaled 3x), doubles width for 2-player
- Frame rate: 60.0988 Hz (NTSC)
- No external dependencies — pure HTML5 Canvas + Web Audio API
- Source data: [CelestialAmber/TetrisNESDisasm](https://github.com/CelestialAmber/TetrisNESDisasm) and [HandicappedTetris](https://github.com/meatfighter/HandicappedTetris) Tetrimino.java
