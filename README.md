# Rename Tabs

A browser extension for renaming any tab with a custom title. Renames persist across refreshes.

## Features

- **Rename any tab** — set a custom title from the toolbar popup; it survives page refreshes.
- **Rename persistence controls** — optionally clear a rename automatically when you navigate away from the page, or when the tab is closed.
- **Auto-capitalize** — an optional toggle that title-cases what you type on blur/rename (not while you're actively typing), with built-in exceptions for brand names like iPhone, iOS, macOS, GitHub, YouTube, etc.
- **Renamed tabs panel** — a quick list of every tab you've currently renamed, with the live favicon and title. Click a row to jump straight to that tab (switching windows if needed), or hover to reveal a close button.
- **Open links in new tab** — links clicked on a renamed page can be forced to open in a new tab instead of navigating away from it.
- **Themes** — Default, Dark, Charcoal, Soft, and High Contrast.
- **Adjustable font size** — Default, Large, Larger, Huge.
- **Order-independent URL matching** — renames still apply if a page's URL query parameters get reordered.

## Installation (unpacked)

1. Clone the repo and install dependencies:
   ```
   npm install
   ```
2. Build the extension:
   ```
   npm run build
   ```
3. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
4. Click **Load unpacked** and select the generated `dist/` folder.

## Development

- `npm run build` — builds the extension into `dist/`.
- `npm run typecheck` — runs TypeScript's type checker with no output emitted.

After making changes, rebuild and click the reload icon on the extension's card in `chrome://extensions` to pick up the new `dist/` output.

## Project structure

- `src/popup` — the toolbar popup UI (rename form, settings, renamed-tabs panel).
- `src/background` — the service worker: cleans up renames on tab close/navigation and handles tab-switching requests from the popup.
- `src/content` — injected into pages to lock the tab title and intercept link clicks when "open in new tab" is enabled.
- `src/shared` — shared types, storage helpers, and URL-matching logic.

## Contributing

Issues and pull requests are welcome — feel free to open one for bugs, feature requests, or improvements.

## License

MIT
