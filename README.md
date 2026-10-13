# Exile Front

An original real-time strategy game for the browser, built to play on an iPhone (and on desktop). It's a love letter to late-90s RTS games: futuristic armies, capturable relay towers, veteran ranks, and a hand of tactical cards you play in the middle of a battle.

No install, no build step, no dependencies. It's plain HTML, CSS and JavaScript.

## Play it

- **Locally:** open `index.html` in a browser.
- **On iPhone:** host the folder anywhere that serves static files (GitHub Pages is set up below), open the URL in Safari, then tap **Share → Add to Home Screen**. It launches full screen like an app. Landscape works best.

### GitHub Pages
1. Merge this branch into `main`.
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. The `Deploy game to GitHub Pages` workflow publishes the site. The URL appears in the workflow run and on the Pages settings page (usually `https://<user>.github.io/<repo>/`).

## Game features
- **Campaign:** 5 missions with briefings, unlocked in order. Progress is saved on the device.
- **Skirmish:** random or seeded maps, 3 sizes, 4 AI difficulty levels, adjustable relay count and starting credits.
- **Economy:** income from your base and from each relay tower you hold, plus a bounty for every kill.
- **7 units:** Trooper, Lancer (anti-armor rockets), Engineer (repairs, fast capture), Raider (fast scout), Bulwark tank, Howler artillery (long range, splash), and the Colossus heavy walker.
- **Rock-paper-scissors damage:** bullets shred infantry, rockets crack armor, artillery levels structures.
- **Tactical cards:** draw one every 40s and every 6 kills (hand of 5). Orbital Lance, EMP Burst, Nanite Mend, Overclock, Drop Pod, Sabotage, Sentry Drop, Minefield, War Bounty. The enemy plays cards too.
- **Veterancy:** units rank up after 3, 7 and 12 kills.
- **Fog of war,** attack-move, rally points, minimap, and synthesized sound effects.

## Controls
| Touch | Mouse / keyboard |
|---|---|
| Tap a unit to select it; double-tap for all of that type | Click a unit; Shift-click to add more; left-drag to box-select |
| Tap ground to move, tap an enemy to attack | Left or right click to give orders |
| One-finger drag to scroll; pinch to zoom | Arrow keys or middle-drag to scroll; wheel to zoom |
| **BOX** toggle turns drag into box-select | `A` attack-move, `S` stop, `B` box mode, Ctrl+A select all |
| Tap your base, then the map, to set a rally point | `1`–`7` build, `Z X C V` / Shift+B cards, `Esc` cancel or pause |
| Hold a build button to cancel one | Right-click a build button to cancel one |

## Files
- `index.html`: page layout and menus
- `style.css`: HUD and menu styling (handles the iPhone safe area)
- `game.js`: the entire game (map generation, simulation, AI, rendering, input, audio)
