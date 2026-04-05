/**
 * LaneUp — Background Controller
 *
 * Responsibilities:
 *  1. Listen for League launching / quitting
 *  2. Register Game Events features when LoL is detected
 *  3. Forward game events to the in-game window
 *  4. Manage opening/closing of desktop + in-game windows
 *  5. Handle hotkeys
 *  6. Read the LCU lockfile to get the dynamic port/password
 */

// ── State ─────────────────────────────────────────────────────────────────────
let _gameRunning   = false;
let _inGameWinId   = null;
let _desktopWinId  = null;
let _lcuPort       = null;
let _lcuPassword   = null;
let _retryTimeout  = null;

// ── App startup ───────────────────────────────────────────────────────────────
overwolf.extensions.onAppLaunchTriggered.addListener(openDesktopWindow);

window.addEventListener('load', () => {
  registerHotkeys();
  checkIfGameAlreadyRunning();
});

// ── Game launch / quit ────────────────────────────────────────────────────────
overwolf.games.onGameLaunched.addListener(info => {
  if (info.gameId !== LEAGUE_GAME_ID) return;
  _gameRunning = true;
  console.log('[LaneUp] League launched — registering game events');
  registerGameEvents();
  openInGameWindow();
});

overwolf.games.onGameInfoUpdated.addListener(info => {
  if (!info || !info.gameInfo) return;
  if (info.gameInfo.id !== LEAGUE_GAME_ID) return;

  // Game exited
  if (!info.gameInfo.isRunning) {
    _gameRunning  = false;
    _lcuPort      = null;
    _lcuPassword  = null;
    console.log('[LaneUp] League closed');
    closeInGameWindow();
    unregisterGameEvents();
  }
});

// ── Check if game is already running on app start ─────────────────────────────
function checkIfGameAlreadyRunning() {
  overwolf.games.getRunningGameInfo(info => {
    if (info && info.id === LEAGUE_GAME_ID && info.isRunning) {
      _gameRunning = true;
      registerGameEvents();
      openInGameWindow();
    }
  });
}

// ── Window management ─────────────────────────────────────────────────────────
function openDesktopWindow() {
  overwolf.windows.obtainDeclaredWindow(WINDOWS.DESKTOP, result => {
    if (result.success) {
      _desktopWinId = result.window.id;
      overwolf.windows.restore(_desktopWinId, () => {});
    }
  });
}

function openInGameWindow() {
  overwolf.windows.obtainDeclaredWindow(WINDOWS.IN_GAME, result => {
    if (result.success) {
      _inGameWinId = result.window.id;
      overwolf.windows.restore(_inGameWinId, () => {});
    }
  });
}

function closeInGameWindow() {
  if (_inGameWinId) {
    overwolf.windows.close(_inGameWinId, () => {});
    _inGameWinId = null;
  }
}

function toggleInGameWindow() {
  if (!_inGameWinId) { openInGameWindow(); return; }
  overwolf.windows.getWindowState(_inGameWinId, result => {
    if (result.window_state_ex === 'minimized' || result.window_state_ex === 'closed') {
      overwolf.windows.restore(_inGameWinId, () => {});
    } else {
      overwolf.windows.minimize(_inGameWinId, () => {});
    }
  });
}

function toggleDesktopWindow() {
  if (!_desktopWinId) { openDesktopWindow(); return; }
  overwolf.windows.getWindowState(_desktopWinId, result => {
    if (result.window_state_ex === 'minimized' || result.window_state_ex === 'closed') {
      overwolf.windows.restore(_desktopWinId, () => {});
    } else {
      overwolf.windows.minimize(_desktopWinId, () => {});
    }
  });
}

// ── Hotkeys ───────────────────────────────────────────────────────────────────
function registerHotkeys() {
  overwolf.settings.hotkeys.onPressed.addListener(event => {
    switch (event.name) {
      case HOTKEYS.TOGGLE_APP:  toggleDesktopWindow(); break;
      case HOTKEYS.SHOW_GUIDE:  toggleInGameWindow();  break;
    }
  });
}

// ── Game Events ───────────────────────────────────────────────────────────────
function registerGameEvents() {
  overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, result => {
    if (result.status === 'success') {
      console.log('[LaneUp] Game events registered:', REQUIRED_FEATURES);
      overwolf.games.events.onNewEvents.addListener(onNewGameEvent);
      overwolf.games.events.onInfoUpdates2.addListener(onInfoUpdate);
    } else {
      // Features not yet available — retry after a short delay (game may still be loading)
      console.warn('[LaneUp] Game events not ready, retrying in 3s…', result);
      _retryTimeout = setTimeout(registerGameEvents, 3000);
    }
  });
}

function unregisterGameEvents() {
  clearTimeout(_retryTimeout);
  overwolf.games.events.onNewEvents.removeListener(onNewGameEvent);
  overwolf.games.events.onInfoUpdates2.removeListener(onInfoUpdate);
}

// ── Game event handlers ───────────────────────────────────────────────────────
function onNewGameEvent(data) {
  if (!data || !data.events) return;

  data.events.forEach(event => {
    console.log('[LaneUp] Game event:', event.name, event.data);

    switch (event.name) {

      case 'death':
        // Forward to in-game window with death payload
        sendToInGame('PLAYER_DIED', {
          deathData: tryParse(event.data),
        });
        break;

      case 'kill':
        sendToInGame('PLAYER_KILL', { killData: tryParse(event.data) });
        break;

      case 'assist':
        sendToInGame('PLAYER_ASSIST', { assistData: tryParse(event.data) });
        break;

      case 'level':
        sendToInGame('PLAYER_LEVEL', { level: tryParse(event.data) });
        break;

      case 'matchStart':
        sendToInGame('MATCH_START', {});
        sendToDesktop('MATCH_START', {});
        break;

      case 'matchEnd':
        sendToInGame('MATCH_END', { data: tryParse(event.data) });
        sendToDesktop('MATCH_END', { data: tryParse(event.data) });
        break;
    }
  });
}

function onInfoUpdate(data) {
  if (!data || !data.feature) return;

  if (data.feature === 'champion_select') {
    // Champ select phase started — pass info to in-game window
    sendToInGame('CHAMP_SELECT_UPDATE', { info: data.info });
  }

  if (data.feature === 'match_info') {
    sendToInGame('MATCH_INFO_UPDATE', { info: data.info });
  }
}

// ── Inter-window messaging ────────────────────────────────────────────────────
function sendToInGame(type, payload) {
  if (!_inGameWinId) return;
  overwolf.windows.sendMessage(_inGameWinId, type, payload, () => {});
}

function sendToDesktop(type, payload) {
  if (!_desktopWinId) return;
  overwolf.windows.sendMessage(_desktopWinId, type, payload, () => {});
}

// ── LCU lockfile reader ───────────────────────────────────────────────────────
// League writes a lockfile at: C:\Riot Games\League of Legends\lockfile
// Format: <name>:<pid>:<port>:<password>:<protocol>
//
// Overwolf doesn't expose direct file system access outside the extension folder,
// so we use overwolf.io to read it. The path needs to be provided by the user
// or detected via overwolf.games.launchers.getRunningLaunchersInfo.
//
// For now: expose a function that in-game.js can call once it knows the LoL path.

function readLCULockfile(lolPath, callback) {
  const lockfilePath = lolPath.replace(/\\/g, '/') + '/lockfile';
  overwolf.io.readFileContents(lockfilePath, overwolf.io.enums.eEncoding.UTF8, result => {
    if (!result.success || !result.content) {
      callback(null);
      return;
    }
    // lockfile format: LeagueClient:<pid>:<port>:<password>:<protocol>
    const parts = result.content.split(':');
    if (parts.length < 5) { callback(null); return; }
    _lcuPort     = parts[2];
    _lcuPassword = parts[3];
    callback({ port: _lcuPort, password: _lcuPassword, protocol: parts[4] });
  });
}

// Expose LCU credentials to other windows via a simple getter
function getLCUCredentials() {
  return _lcuPort ? { port: _lcuPort, password: _lcuPassword } : null;
}

// ── Utility ───────────────────────────────────────────────────────────────────
function tryParse(str) {
  try { return JSON.parse(str); } catch (_) { return str; }
}
