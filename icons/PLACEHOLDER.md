# Icons Required

Overwolf requires these icon files before the app can be loaded:

| File              | Size      | Usage                                      |
|-------------------|-----------|--------------------------------------------|
| `icon.png`        | 256×256   | App icon (color) — shown in OW dock        |
| `icon_gray.png`   | 256×256   | App icon (grayscale) — shown when inactive |

Both files must be placed in this `icons/` folder.

Simple placeholder icons can be generated at https://favicon.io or any
image editor. For a proper LaneUp icon, use a blue shield or "L" logo on
a dark background to match the app's color scheme (#2563eb on #0f1117).

These icons are referenced in `manifest.json` under `meta.icon` and `meta.icon_gray`.
