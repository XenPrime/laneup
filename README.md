# LaneUp

A beginner-focused League of Legends companion app built on the Overwolf platform. LaneUp gives new players real-time tips, role guidance, and live stat tracking during their matches.

---

## Project Status

Currently in **prototype / planning phase**. The frontend has been designed as an interactive HTML prototype. No Overwolf app shell has been scaffolded yet.

---

## What's Been Built

The `/prototype` folder contains a full interactive frontend mockup covering every screen of the app:

| Screen | Description |
|---|---|
| Home / Onboarding | Role selection as a quest system. Skip option for players who don't know their role yet. |
| Role Guide | Full beginner breakdown per role. Support is fully written; Top, Jungle, Mid, Bot are stubbed. |
| Champion Select Overlay | Auto-detects assigned role via LCU API. Handles autofill and quest mismatch scenarios. |
| In-Game Overlay | Live stat panel — KDA, vision score, ward reminders, phase tips. Toggle with hotkey. |
| Post-Game Summary | Beginner-friendly performance recap with actionable focus points. |
| Settings | App preferences (hotkeys, toggles) and recommended in-game settings with explanations. |

Open `prototype/laneup-prototype.html` in any browser to explore it.

---

## Architecture

### Platform
- **Overwolf** — handles the overlay, hotkeys, window management, and second monitor support. Riot officially permits Overwolf apps. ToS-safe.
- App is built as a web app (HTML / CSS / JavaScript or React) that Overwolf wraps in a Chromium shell.

### Data Sources

| Source | What it gives you | When |
|---|---|---|
| `localhost:2999/liveclientdata/allgamedata` | Champion, level, KDA, CS, gold, game time, items | During active game |
| LCU API `/lol-champ-select/v1/session` | `assignedPosition` — the role the player got | During champ select |
| LCU API `/lol-lobby/v2/lobby` | `firstPositionPreference`, `secondPositionPreference` | In lobby pre-queue |
| LCU API `/lol-end-of-game/v1/eog-stats-block` | Full post-game stats | After game ends |
| Riot Data Dragon | Static champion data, icons, ability info | Cached at install |

**Important:** The LCU API runs on a dynamic local port. Read the `lockfile` Riot writes to the League install directory. It contains the port and a base64-encoded password for Basic auth.

### LCU Position Values

| What Riot calls it | What it means |
|---|---|
| `top` | Top Lane |
| `jungle` | Jungle |
| `middle` | Mid Lane |
| `bottom` | Bot Lane (ADC) |
| `utility` | Support |

### Autofill Detection Logic
The app compares three values to classify each game:

1. **Active quest** — what role the player has been learning in LaneUp
2. **firstPositionPreference** — what they queued for in lobby
3. **assignedPosition** — what they actually got in champ select

| Scenario | Result |
|---|---|
| Got primary, quest matches | Normal load — guide activates silently |
| Got primary, no quest set | Guide loads, nudge to start a quest |
| Got secondary / fill | Soft note, load assigned role guide |
| Got neither (true autofill) | Autofill banner, load assigned role guide, save primary quest |
| Has quest for different role | Mismatch banner, switch guide for this game, save quest progress |
| Autofilled AND quest mismatch | Combined message, lead with mismatch framing |

---

## Content That Needs Filling In

The `ROLES` data object in the prototype JS has Support fully written. The other four roles have stubbed placeholders marked with `[Fill in: ...]`. You need to research and write:

- **3 main responsibilities** per role
- **3 game phase descriptions** (Early / Mid / Late) per role
- **4 "good time to fight" conditions** per role
- **4 "avoid fighting" conditions** per role

Good sources: Skill Capped, ProGuides, Mobafire role guides, Reddit r/summonerschool. Aim for beginner language — no assumed knowledge.

---

## Project Structure

```
laneup/
├── prototype/
│   └── laneup-prototype.html     # Full interactive frontend mockup
├── src/
│   ├── components/               # React components (to be built)
│   ├── data/                     # Role tip JSON files (to be built)
│   ├── styles/                   # CSS / design tokens
│   └── utils/                    # LCU API helpers, polling logic
├── assets/                       # Icons, images
├── docs/                         # Additional notes
└── README.md
```

---

## Getting Started (When You're Ready to Build)

### 1. Set up Overwolf
- Create an account at overwolf.com/developers
- Download the Overwolf client and developer tools
- Read the Overwolf App Tutorial docs
- Register your app to get an App UID

### 2. Scaffold the App
Recommended stack:
- **React + TypeScript** for UI components
- **Vite** as the build tool
- **Tailwind CSS** for styling
- **Zustand** for lightweight state management

### 3. Wire Up the LCU API
```js
// Read the lockfile to get port + password
// Windows: C:\Riot Games\League of Legends\lockfile
// Format: processName:PID:port:password:protocol

const headers = { Authorization: "Basic " + btoa(":" + password) };
const session = await fetch("https://127.0.0.1:" + port + "/lol-champ-select/v1/session", { headers });
const data = await session.json();
const me = data.myTeam.find(p => p.cellId === data.localPlayerCellId);
const role = me.assignedPosition; // top | jungle | middle | bottom | utility
```

### 4. Wire Up Live Client Data
```js
// Runs during an active game — no auth needed
const gameData = await fetch("http://localhost:2999/liveclientdata/allgamedata");
// Poll every 1500ms during a game
```

---

## Roadmap

- [ ] Fill in role content for Top, Jungle, Mid, Bot
- [ ] Scaffold Overwolf app shell (manifest, windows config)
- [ ] Convert prototype to React components
- [ ] Build LCU polling service (lobby → champ select → in-game → post-game)
- [ ] Build Live Client Data polling service
- [ ] Build tip rotation system (phase-aware, cooldown between tips)
- [ ] Wire autofill detection logic to real LCU data
- [ ] Post-game stats integration
- [ ] Hotkey system (toggle overlay, move to monitor 2)
- [ ] Settings persistence (Overwolf settings API)
- [ ] Overwolf app store submission

---

## For Mac — Last synced April 4, 2026

Pull this repo and open `prototype/laneup-prototype.html` in a browser. Everything is up to date as of this sync.

**What was completed in this session (Windows):**

- All 5 role guides fully written — Top, Jungle, Mid, Bot, ADC, Support (previously only Support was done)
- Synergy section added to every role — support types for ADC, ADC types for Support, jungler/map synergy for Top/Mid/Jungle
- Champion select overlay expanded with a Guide tab (all 3 phases) and a Synergy tab
- Role Guide screen made fully dynamic — switcher buttons now work for all 5 roles, synergy section renders per role
- Quest selection fixed — clicking a role card and hitting Start Learning now properly sets the active quest, updates the hero banner, and highlights the correct card
- All encoding issues fixed (dashes, arrows, checkmarks were garbled)
- Dev/AI notes removed from the modal footer

**Next up on the roadmap:**
- Scaffold the Overwolf app shell (manifest, windows config)
- Convert prototype to React components
- Build LCU polling service (lobby → champ select → in-game → post-game)

---

## Notes for Continuing on Another Machine

This project was started using Claude (Cowork mode). To continue on any machine:

1. Clone this repo from GitHub
2. Open Claude (Cowork mode on desktop)
3. Select the cloned repo folder so Claude has full file access
4. Reference specific screens or features you want to work on next

The prototype HTML is self-contained — no dependencies, no build step. Just open it in a browser.

---

## Key Decisions Made So Far

- **ADC is Medium-Hard difficulty**, not beginner-friendly — don't recommend it as a starting role
- **Support is the recommended starting role** for brand new MOBA players
- **Tips don't cover matchups** — scope is fundamentals only
- **No enemy team data** shown in the overlay — keeps cognitive load low for new players
- **Autofill and quest mismatch** are treated as the same UX problem: wrong guide loaded, same fix
- **Panel width target: ~300px** for in-game overlay for readability


