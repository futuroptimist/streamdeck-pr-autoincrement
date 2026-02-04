# Stream Deck: GitHub PR Auto-Increment (Clipboard → 4 PR URLs)

A tiny Stream Deck plugin for a very specific workflow:

- You copy a GitHub Pull Request URL (ending in `/pull/<number>`) to your clipboard, e.g.
  `https://github.com/democratizedspace/dspace/pull/3366`
- You press a Stream Deck key
- The plugin replaces your clipboard contents with a 4-line bullet list of incrementing PR URLs:

```text
- https://github.com/democratizedspace/dspace/pull/3366
- https://github.com/democratizedspace/dspace/pull/3367
- https://github.com/democratizedspace/dspace/pull/3368
- https://github.com/democratizedspace/dspace/pull/3369
```

Then you paste wherever you want (terminal, editor, GitHub comment box, etc.).

## Why this exists

Stream Deck’s built-in text actions are great at *pasting* but not at doing math. This plugin does the math and uses the clipboard as the handoff.

## Supported platforms

- Windows (PowerShell clipboard read/write)
- macOS (pbpaste / pbcopy)

Linux support can be added (typically via `xclip`), but is not included by default.

## Requirements

- Stream Deck app installed
- Node.js (for development only)
- Stream Deck CLI (recommended for dev workflow + packaging)
  - Docs: Stream Deck CLI intro citeturn0search4
  - Create scaffolding: `streamdeck create` citeturn0search15
  - Dev install via link: `streamdeck link` citeturn0search0
  - Package installer: `streamdeck pack` citeturn0search1turn0search13

> Note: If you’re only installing a published release `.streamDeckPlugin`, you don’t need Node or the CLI.

## Install (from a release)

1. Download the latest `.streamDeckPlugin` file from this repo’s Releases page.
2. Double-click the `.streamDeckPlugin` file to install it into the Stream Deck app.
3. Open Stream Deck → find the plugin action → drag it onto a key.

### Verify it’s installed
(Optional) If you have the Stream Deck CLI installed, you can list installed plugins:

```bash
streamdeck list
```

(Shows installed plugins and source paths.) citeturn0search7

## Install (local development clone)

This is the best path if you want to tweak behavior (count, formatting, regex, etc.).

### 1) Clone + install deps

```bash
git clone <THIS_REPO_URL>
cd <REPO_DIR>
npm install
```

### 2) Build once

```bash
npm run build
```

### 3) Link the plugin into Stream Deck (dev install)

From the directory that contains the `*.sdPlugin/` folder:

```bash
streamdeck link <your-plugin-uuid>.sdPlugin
```

The directory name **must** match the plugin UUID and end with `.sdPlugin`, per the CLI docs. citeturn0search0

### 4) Run watch mode (recommended)

```bash
npm run watch
```

This rebuilds on changes. Restart Stream Deck (or the plugin) if needed after big manifest changes.

### 5) Add the action to a key
In the Stream Deck app, locate the action (e.g., “PR List from Clipboard”) and drag it onto a key.

## Use

1. Copy a GitHub PR URL to your clipboard (must end with `/pull/<number>`).
   - Example: `https://github.com/democratizedspace/dspace/pull/3366`
2. Press the Stream Deck key.
3. Paste wherever you want.

Tip: If you want “one button that generates *and* pastes”, create a **Multi Action**:
1) press this plugin key (updates clipboard)
2) trigger your normal paste keystroke

## Behavior details

- Input must match: `.../pull/<digits>` (optional trailing slash is ok)
- Output is always exactly 4 lines (for now)
- Output format is bullet list, one per line, `- <url>`

If the clipboard doesn’t look like a PR URL:
- The action shows an alert on the key
- Clipboard remains unchanged

## Development notes

### Key pieces of Stream Deck plugin structure

- `manifest.json` defines plugin metadata and actions citeturn0search5
- Action UUIDs should be stable (don’t change once you start using them) citeturn0search2
- Plugins communicate with the Stream Deck app via a WebSocket connection citeturn0search3

### Suggested repo structure

```text
.
├─ src/
│  ├─ actions/
│  │  └─ pr-list.ts
│  └─ plugin.ts (or index.ts)
├─ <plugin-uuid>.sdPlugin/
│  ├─ manifest.json
│  └─ imgs/...
├─ package.json
└─ README.md
```

### Packaging a release

When ready, package an installer file:

```bash
streamdeck pack <plugin-uuid>.sdPlugin
```

This produces a `.streamDeckPlugin` file suitable for distribution. citeturn0search1turn0search13

You can control what gets included using a `.sdignore` file (gitignore-style). citeturn0search1

## Customization ideas

- Make the count configurable via action settings + a Property Inspector UI
- Add alternate output formats:
  - raw URLs (no bullets)
  - Markdown links
  - numbered list
- Add support for GitHub compare URLs, issue URLs, etc.

## License

MIT (recommended).

---

If you’re using this repo as a starting point, the first implementation target is:
- A single action that reads clipboard → generates 4 incrementing PR URLs → writes clipboard.
