/**
 * LaneUp — Shared Constants
 * Referenced by background.js, desktop.html, and in-game.html
 */

// Overwolf game ID for League of Legends
const LEAGUE_GAME_ID = 5426;

// Overwolf Game Events features we want to register for LoL.
// Only request what we actually use — keeps the manifest lean.
const REQUIRED_FEATURES = [
  'death',           // player death events          → death review overlay
  'kill',            // kill events                  → post-game feedback
  'assist',          // assist events                → post-game feedback
  'level',           // level-up events              → death rule engine (pre-6)
  'minions_killed',  // CS count                     → post-game feedback
  'match',           // matchStart / matchEnd        → session lifecycle
  'match_info',      // in-game metadata (gameMode)  → context checks
  'summoner_info',   // summoner name / region       → LCU correlation
  'champion_select', // champ-select phase events    → CSO panel trigger
];

// Window names — must match manifest.json keys exactly
const WINDOWS = {
  BACKGROUND: 'background',
  DESKTOP:    'desktop',
  IN_GAME:    'in_game',
};

// Hotkey names — must match manifest.json hotkeys keys
const HOTKEYS = {
  TOGGLE_APP:  'toggle_app',
  SHOW_GUIDE:  'show_guide',
};

// LCU local API base (dynamic port read from lockfile in background.js)
const LCU_BASE_PLACEHOLDER = 'https://127.0.0.1:{PORT}';

// Live Client Data API (no auth, available during active game)
const LIVE_CLIENT_BASE = 'http://localhost:2999/liveclientdata';

// Death review auto-dismiss delay (ms)
const DEATH_REVIEW_DISMISS_MS = 12000;

// Poll interval for Live Client Data fallback (ms)
const LIVE_CLIENT_POLL_MS = 2000;
