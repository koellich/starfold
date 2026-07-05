# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

STARFOLD, a Starflight homage: pure HTML5 canvas + vanilla JavaScript, no dependencies, no build step, no tests, no lint config. EGA palette, keyboard only.

**Run it:** open `index.html` in a browser. That's the entire toolchain. Verification is manual play; a fresh game starts via NEW VOYAGE, and a saved game resumes via CONTINUE (localStorage key `starfold_save_v1`).

The game version is the semver constant `SF.VERSION` (util.js), shown on the title screen; bump it on release-worthy changes.

`SPOILERS.html` is the player hint book and design reference (a self-contained page with collapsible Hint/Answer reveals and a Part II mechanics section; there is no longer a SPOILERS.md): the authoritative map of the story spine, critical path, and tuning values. When changing quest logic, dialogue gates, economy, or endings, check it first and keep it in sync.

## Architecture

Everything hangs off a single global namespace `window.SF` (created in `util.js`). There are no modules; `index.html` loads the scripts in strict dependency order:

```
util.js → ui.js → data.js → galaxy.js → game.js → space.js → surface.js → encounter.js → station.js → story.js
```

A new file must be added to `index.html` at the right position in that chain.

### Mode state machine

The game is a set of modes registered in `SF.modes` and switched with `SF.setMode(name, arg)`. Each mode is an object with optional hooks called by the main loop in `game.js`:

- `enter(arg)`: on switch
- `key(k)`: per keydown
- `tick(dt)`: per frame, dt in seconds (capped at 0.1)
- `draw(dt)`: per frame, after `tick`

Modes and where they live: `title`, `intro`, `ending`, `gameover` (story.js); `space`, `starmap`, `orbit` (space.js); `surface` (surface.js); `encounter` (encounter.js); `station` (station.js); `pager` is a slot filled on demand via `SF.ui.pager(...)`.

### Game state and saves

All mutable state lives in one JSON-serializable object, `SF.G` (created in `SF.newGame`, game.js). Saving is `JSON.stringify(SF.G)` to localStorage; **never put functions, class instances, or Maps in `SF.G`**. `SF.load` rejects any save whose `v` doesn't match, so a breaking change to the save shape requires bumping `v` and `SF.SAVE_KEY` together (currently 1 / `starfold_save_v1`), which orphans old saves.

Story/quest progression is tracked almost entirely through `SF.G.flags` (free-form booleans), `SF.G.rel` (per-race reputation), and `SF.G.virtue`/`deeds` (moral ledger read at the endgame judgment; positive deeds have diminishing repeats, sins don't; see `SF.deed` in game.js).

### Deterministic world generation

The galaxy is **not stored in the save**. `SF.genGalaxy()` regenerates it identically at every boot from fixed seeds (`SF.mulberry32`, `SF.hash` in util.js; master seed `0xC0FFEE` in galaxy.js). The save only records the player's *diffs* against that world: `visited`, `known`, `mined`, `taken`, `partial`, `whKnown`, etc. Consequences:

- Changing generation code or seeds silently changes the world under existing saves: deposit indices in `mined`/`taken` refer to generated arrays by position.
- Hand-placed story content lives in data tables at the top of galaxy.js (`SF.STORY_STARS`, `SF.FLUXES`) and space.js (`SF.SPHERES`); coordinates cross-reference dialogue hints in data.js and the walkthrough in SPOILERS.html.
- Planet surfaces (384×240 tiles, `SF.SURF_W/H`) are generated on demand and memoized in `SF.galaxy.surfCache`.

Sector space is 250×200 units (`SF.SECTOR`).

### Content vs. logic split

`data.js` is (almost) pure content: elements, upgrade tiers/prices, artifacts, races, ship stats, dialogue pools, rumor/help/story text. Dialogue lines can be plain strings or objects with gates: `req(G)` (predicate), `once` (flag set when delivered), `act` (side effect), `journal` (auto-log). `SF.getDialogLine` (encounter.js) prefers gated clue lines over flavor. Balance changes are usually data.js edits; behavior changes live in the mode files.

### UI conventions

- Fixed 960×600 canvas; layout rects in `SF.L` (ui.js): viewport left, status panel right, scrolling console bottom.
- All drawing goes through `SF.ui` helpers; text is monospace with metrics `SF.CH`/`SF.LH`; alignment is done by character counts (`SF.wrap`, `SF.ui.ctext`).
- Colors must come from the 16-color EGA palette `SF.P`. Note the data tables (elements, races, star classes, planet types) capture `SF.P.*` strings at script load, so the palette cannot be swapped at runtime.
- Interactive menus use `SF.Menu` / `SF.QtyPrompt`, which share a key/draw contract (`key(k)` returns `{pick}` / `{cancel}` / null); modes hold the active menu and forward keys to it before handling their own.
- Player-facing messages go through `SF.log(msg, color)`; durable story beats additionally through `SF.journal(text)` (readable under CAPTAIN > LOG). The console keeps 400 lines of scrollback. SHIFT+↑/↓ (aliases: PGUP/PGDN) paging is handled globally in game.js before mode dispatch (disabled while a pager mode is active, and SHIFT+arrows stay with the landing crosshair in orbit mode). New `SF.log` traffic advances the view toward the newest line but never past unread rows: `SF.logSeen` is the read cursor (rows drawn at the live edge count as read), and a burst deeper than one console page pins the view at the oldest unread row with a "SPACE: N MORE" tag — SPACE (`SF.logAdvance`) pages forward without blocking other input. For long cinematic beats use the paged flow instead: `SF.flowStart()` diverts subsequent `SF.log` calls into a queue, `SF.flowNext()` releases the first console page, and the player advances page by page with SPACE (all other input is swallowed until the queue drains; the judgment scene uses this).
- Sound is WebAudio bleeps via `SF.sfx.*` (util.js); pick an existing effect rather than adding oscillator code inline.
