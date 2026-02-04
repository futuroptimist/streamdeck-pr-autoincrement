# Stream Deck: GitHub PR Auto-Increment

A Stream Deck plugin that reads a GitHub Pull Request URL from your clipboard and replaces it with a 4-line bullet list of incrementing PR URLs.

**Example**

Input clipboard:

```
https://github.com/democratizedspace/dspace/pull/3366
```

Output clipboard:

```
- https://github.com/democratizedspace/dspace/pull/3366
- https://github.com/democratizedspace/dspace/pull/3367
- https://github.com/democratizedspace/dspace/pull/3368
- https://github.com/democratizedspace/dspace/pull/3369
```

## Install (from a release)

1. Download the latest `.streamDeckPlugin` file from the Releases page.
2. Double-click the `.streamDeckPlugin` file to install it into the Stream Deck app.
3. Open Stream Deck and drag the action onto a key.

## Install (from source)

```bash
git clone <REPO_URL>
cd streamdeck-pr-autoincrement
npm install
npm run build
```

## Dev install via Stream Deck CLI

From the directory containing `com.futuroptimist.prlist.sdPlugin`:

```bash
streamdeck link com.futuroptimist.prlist.sdPlugin
```

## Packaging a release

```bash
streamdeck pack com.futuroptimist.prlist.sdPlugin
```

## Usage

1. Copy a GitHub PR URL that ends with `/pull/<number>`.
2. Press the Stream Deck key assigned to this action.
3. Paste anywhere to get the 4-line bullet list.

## Quick verification commands

```bash
npm install
npm run build
streamdeck validate com.futuroptimist.prlist.sdPlugin
streamdeck link com.futuroptimist.prlist.sdPlugin
```

Manual smoke test:

- Set clipboard to: `https://github.com/democratizedspace/dspace/pull/3366`
- Press the Stream Deck key
- Paste and confirm four bullet lines ending in 3366..3369
