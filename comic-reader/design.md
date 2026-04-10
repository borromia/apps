# Comic Reader — Design Document

## Overview

A single-file (`comic-reader.html`) browser-based comic/media reader. No build step, no server required — open directly in Chrome or Edge. Uses the **File System Access API** to read a local directory, and **idb-keyval** to persist state across sessions.

## Tech Stack

| Concern | Solution |
|---|---|
| File access | `window.showDirectoryPicker()` — File System Access API |
| Persistence | `idb-keyval@6` via CDN (`https://unpkg.com/idb-keyval@6/dist/umd.js`) |
| OCR | `tesseract.js@5` via CDN (`https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js`) |
| Styling | Vanilla CSS, dark mode, macOS-style `backdrop-filter: blur()` frosted glass |
| JS | Vanilla ES2022, no framework, no bundler |

> Browser support: Chrome/Edge only (Firefox does not support `showDirectoryPicker`).

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│  TOP BAR                                            │
│  [Open Folder] [path]  [zoom] [speed] [Tiles|Comic] [⛶] │
├──────────────┬──┬──────────────────────────────────┤
│  SIDEBAR     │  │  CONTENT AREA                    │
│  ─────────── │  │  ┌─────────────────────────────┐ │
│  Explorer [sort] │  │  INFO PANEL                 │ │
│  [search bar]│  │  │  title / subtitle / meta    │ │
│              │  │  │  tags  [Extract & Tag][Trash]│ │
│  file tree   │  │  └─────────────────────────────┘ │
│  (lazy)      │  │  image grid / comic strip        │ │
│              │  │                                  │ │
└──────────────┴──┴──────────────────────────────────┘
```

The sidebar and content area are separated by a **draggable resizer** (`#resizer`) that adjusts sidebar width between 120px and (viewport − 200px).

---

## Top Bar Controls

- **Open Folder** — calls `showDirectoryPicker`, saves handle to idb-keyval under key `comicReaderDir`
- **Current path label** — shows root folder name
- **Zoom slider** — range 50–300%, step 10. Controls `--zoom` CSS variable on `#content`. Affects tile min-width and comic strip max-width
- **Video speed slider** — range 0.5×–5×, step 0.25. Applies `playbackRate` to all `<video>` elements live. Label shows current value (e.g. `1×`)
- **Tiles / Comic** mode toggle
- **Fullscreen** button — `document.documentElement.requestFullscreen()`

---

## Sidebar — Explorer

### File Tree

- Built by `buildTree(container, dirHandle, depth, parentPath)` — recursive, lazy (children only loaded when a folder is expanded)
- Each directory row has:
  - Chevron icon (rotates 90° when open)
  - Folder icon
  - Name
  - Child count badge (fetched in parallel via `Promise.all` at build time)
  - `data-path` attribute — full relative path from root (e.g. `manga/One Piece`)
  - `row._expand(andLoad)` method — programmatically expands the node and optionally loads its images
- Files shown in tree: images, videos, PDFs (matched by `MEDIA_EXT`)
- Sort: alphabetical (default) or by descending child count (`sortByCount` flag)

### Sort Toggle

- Button in sidebar header: "by count"
- Toggles `sortByCount`, rebuilds tree, re-expands to current path
- Persisted in URL as `?sort=count`

### Search

- Input below sidebar header
- Searches **folder names only** (not files) — case-insensitive
- Flat list built by `collectAll(rootHandle)` — recursive, directories only, cached after first search
- Results show: folder icon, highlighted name, parent path
- Clicking a result calls `loadFolderImages(entry, row, path)`
- Cache invalidated when a new root folder is opened
- 200ms debounce on input

---

## Content Area

### Info Panel (`#info-panel`)

Shown above the grid/strip whenever a folder is selected. Contains:

- **Title** — folder name (large, bold)
- **Subtitle** — parent folder name shown as `in <parent>` (muted, smaller)
- **Meta line** — `N images · X.XX MB` (total size of all media files in folder)
- **Tags row** — genre tags as pills (blue accent). Shows placeholder if none yet
- **OCR progress bar** — hidden until extraction runs
- **Action row**:
  - `Extract text & tag` button (left)
  - `Move to Trash ⌫` button (right, red-tinted)

### OCR & Tagging

- Uses Tesseract.js worker (`eng` language)
- Runs sequentially through all image file handles in the current folder
- Progress shown as bar + `Reading page X / N…` status
- Extracted text matched against `TAG_KEYWORDS` map (9 genres: action, romance, comedy, horror, fantasy, sci-fi, slice-of-life, adventure, drama)
- Tags saved to idb-keyval under key `tags:<folderName>` and reloaded on next visit

### Tile View (`#image-grid`)

- CSS grid: `repeat(auto-fill, minmax(calc(var(--zoom) * 180px), 1fr))`
- Each tile: `aspect-ratio: 3/4`, rounded corners, border, hover scale effect
- **Images** — `<img loading="lazy">`
- **Videos** — lazy-loaded via `IntersectionObserver` (`videoLazyObserver`): `src` set only when tile enters viewport (10% threshold), paused when it leaves. Autoplay, loop, muted
- **PDFs** — document icon + filename, no preview
- **Hover tooltip** — frosted glass tooltip showing: page number, filename (wrapping), file size, dimensions (W×H, read from `naturalWidth` after load), last modified date
- **Click** — opens lightbox at that item's current index (looked up by handle reference in `items` array)

### Comic Strip View (`#comic-strip`)

- Vertical flex column, centered
- Each item preceded by a `Page X / N` separator with horizontal rules
- **Images** — `<img loading="lazy">`, full width up to `calc(var(--zoom) * 900px)`, bordered
- **Videos** — `<video controls autoplay loop muted>`, 16:9 aspect ratio, same max-width
- **PDFs** — `<iframe>`, height `calc(var(--zoom) * 1200px)`

---

## Lightbox

Triggered by clicking a tile. Full-screen overlay with macOS frosted glass backdrop (`blur(28px) saturate(160%)`).

- Shows one item at a time: `<img>`, `<video autoplay muted controls loop>`, or `<iframe>` (PDF)
- Fresh blob URL created per frame via `handle.getFile()` — previous blob revoked on each navigation
- Page label: `X / N · filename · W × H` (dimensions appended on image load)
- Left/right nav buttons (disabled at ends)
- Close button (top-right, fixed position)

### Keyboard shortcuts (lightbox open)

| Key | Action |
|---|---|
| `←` | Previous item |
| `→` | Next item |
| `Escape` | Close lightbox |
| `Backspace` | Trash current file (single file, not folder) |

---

## Keyboard Shortcuts (global, lightbox closed)

| Key | Action |
|---|---|
| `↑` | Navigate to previous sibling folder |
| `↓` | Navigate to next sibling folder |
| `Backspace` | Move current folder to Trash |

Sibling order respects current sort (alphabetical or by count).

---

## Trash System

### Folder trash (`trashCurrentFolder`)

- Triggered by "Move to Trash" button or `Backspace` (outside lightbox)
- Flow:
  1. `requestPermission({ mode: 'readwrite' })` on rootHandle — must be first `await` to preserve user activation
  2. `confirm()` dialog showing destination path
  3. Recursively copy folder to `trash/<original-path>` (preserving hierarchy)
  4. Recursively delete original
  5. Collect sorted siblings before deletion → navigate to next (or previous) sibling automatically
  6. Rebuild tree, re-expand to new path via `expandTreePath`

### Single file trash (`trashCurrentFile`)

- Triggered by `Backspace` when lightbox is open
- Copies single file to `trash/<currentDirPath>/<filename>`
- Removes original via `currentDirHandle.removeEntry(name)`
- Splices item from `lbItems`, `currentFileHandles`, `currentMediaEls`
- Removes the single DOM element (tile or strip item + separator) — **no full re-render, no scroll reset**
- Advances lightbox to next item (or previous if at end)

---

## State & Persistence

### idb-keyval keys

| Key | Value |
|---|---|
| `comicReaderDir` | `FileSystemDirectoryHandle` — root folder |
| `tags:<folderName>` | `string[]` — genre tags for that folder |

### URL params

| Param | Value |
|---|---|
| `?comic=path/to/folder` | Currently open folder (relative path from root) |
| `?sort=count` | Sort by item count (absent = alphabetical) |

On page load, if `comicReaderDir` handle has `granted` permission, the tree is built and `expandTreePath(?comic)` is called to restore the last open folder and expand the tree to it.

---

## Key Functions

| Function | Description |
|---|---|
| `buildTree(container, dirHandle, depth, parentPath)` | Recursively builds the file tree. Each dir row gets `data-path` and `_expand(andLoad)` |
| `expandTreePath(targetPath, andLoad)` | Walks path segments, finds rows by `data-path`, calls `_expand` on each |
| `loadFolderImages(dirHandle, row, dirPath)` | Collects media handles, sums sizes, shows info panel, calls `renderFromHandles` |
| `renderFromHandles(fileHandles)` | Builds tile grid or comic strip. Populates `currentMediaEls` parallel to `currentFileHandles` |
| `openLightbox(items, index)` | Sets `lbItems = items`, shows frame |
| `showLightboxFrame()` | Async. Creates fresh blob from `lbItems[lbIndex].handle.getFile()`, revokes previous |
| `trashCurrentFolder()` | Copies+deletes folder, navigates to sibling |
| `trashCurrentFile()` | Copies+deletes single file, removes DOM element, advances lightbox |
| `getSortedSiblings(parentHandle)` | Returns sibling dir names sorted per `sortByCount` |
| `navigateSibling(direction)` | Moves to prev/next sibling folder via `expandTreePath` |
| `collectAll(dirHandle, path)` | Recursively collects all subdirectories (not files) for search |
| `runSearch(query)` | Filters `allEntries` by name, renders result rows |
| `setUrlParam(path)` | Updates `?comic=` and `?sort=` without page reload |

---

## Media Types

| Extension | Tile | Comic Strip | Lightbox |
|---|---|---|---|
| jpg, png, gif, webp, avif, bmp | `<img>` lazy | `<img>` lazy | `<img>` fresh blob |
| mp4, webm, mov, mkv, avi | `<video>` IntersectionObserver lazy | `<video autoplay muted controls>` | `<video autoplay muted controls>` |
| pdf | Document icon | `<iframe>` | `<iframe>` |

---

## Important Implementation Notes

- **Blob URL lifecycle**: blobs are created fresh on each render/lightbox frame and revoked immediately after use. Never store blob URLs long-term — always store `FileSystemFileHandle` and call `.getFile()` fresh.
- **Tile click index**: tile click handlers use `items.findIndex(it => it.handle === handle)` at click time (not captured `i`) so indices remain correct after deletions.
- **`currentMediaEls`**: parallel array to `currentFileHandles`. In tile mode stores the tile `<div>`; in comic mode stores `{ el, sep }`. Used for surgical DOM removal on single-file trash.
- **`_expand` method**: stored directly on the row DOM element. Allows `expandTreePath` to programmatically open tree nodes without simulating click events.
- **Permission timing**: `requestPermission` must be the first `await` inside any click handler that needs write access — browser requires user activation to still be valid.
- **`lbItems` and `items` share the same array reference** after `openLightbox(items, idx)` sets `lbItems = items`. Splicing `lbItems` in `trashCurrentFile` is reflected in the tile click closures.
