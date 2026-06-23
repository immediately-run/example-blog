# immediately.run Blog & Wiki — Feature Implementation Plan

This is a multi-phased engineering plan to build the customizable, theme-friendly Blog & Wiki application (`example-blog`) running natively on immediately.run. 

This document defines the implementation roadmap, step-by-step instructions, and clear, measurable exit criteria for each phase. This plan is designed to be easily executed by a junior developer or a simple language model.

---

## Phase 1: Project Scaffolding & Custom Component Ecosystem (Core Layout)

### Goal
Establish the project layout, wire up necessary styling and design tokens from the brand guidelines, and register custom global components that can be used inside MDX files without explicit imports.

### Step-by-Step Instructions
1. **Design Tokens & Global CSS (`styles2.css`):**
   - Refactor `styles2.css` (or define inline stylesheet overrides) to enforce the immediately.run brand styling:
     - Background: Cool near-black canvas (`--bg`).
     - Ink/Text: Clean near-white/grey (`--ink`).
     - Accents: Signature gradient (`--grad` token, e.g., `.grad-text`).
     - Details/Metadata: Use `Space Mono` or monospace fonts.
     - Borders: Hairline solid lines (`1px solid var(--panel)`).
     - Hover Shadows: Hard-offset solid block shadows on clickable cards.
     - Casing: Strict sentence case for headlines, with headings terminating in a period (e.g. `Tech stack.`).
     - **No Emoji:** Strip any present or future emojis from the layout.
2. **MDX Reusable Component Registry:**
   - Create a directory for reusable layout elements: `src/components/`.
   - Implement the following default components (following the **React Fast Refresh rule** - one default-exported component per file, no mixed named exports of data/logic):
     - `Callout.tsx`: Renders high-contrast info/warning box with hairline borders.
     - `Button.tsx`: Renders a clickable button with block hover-shadow styling.
     - `More.tsx`: A simple placeholder component `<div className="read-more-marker" />` used to identify content excerpt cutoff points.
3. **MDX Provider Wiring (`App.tsx`):**
   - Refactor `App.tsx` to serve as the single entry point.
   - Import `MDXProvider` from `@immediately-run/sdk` (or its specific path).
   - Wrap the main application structure inside `<MDXProvider components={{ Callout, Button, More }}>`.
   - Confirm that standard MDX files can evaluate `<Callout>` or `<Button>` tags without needing an `import` declaration within the `.mdx` file.

### Exit Criteria
- `npm run build` succeeds with zero errors.
- Visual check: Layout features a cool near-black theme with sentence-case headlines ending in periods, hairline borders, and zero emojis.
- Validation: An MDX file containing a `<Callout>` element compiles and renders without throwing reference or import errors.

---

## Phase 2: Metadata Harvesting, Search & Sidebar Categorization

### Goal
Implement client-side frontmatter parsing and compilation of an in-memory metadata index to power list queries, tag categorization, and rapid search without any database backends.

### Step-by-Step Instructions
1. **Frontmatter Parser Utility (`src/lib/parser.ts`):**
   - Implement a lightweight parser that reads the first 1000 characters of an `.mdx` file to parse YAML frontmatter block headers (`title`, `date`, `tags`, `readtime`, `excerpt`).
2. **Local Metadata Indexer:**
   - Integrate with `@immediately-run/sdk/hooks` using `useMetadataQuery` and `useFileMetadata` to load metadata for files inside the repository (under `/app/pages/entries/`).
   - Sort posts dynamically by `date` (newest first).
3. **Sidebar & Category System:**
   - Construct a category sidebar that extracts a unique set of all tags found across all posts.
   - Support clicking a tag card to filter the main articles grid dynamically.
4. **Instant Client-Side Search:**
   - Implement a search text field in the main view.
   - Filter the parsed in-memory metadata array instantly against the search query (matching titles, tags, and excerpts).

### Exit Criteria
- The landing page compiles and correctly displays cards with `title`, `date`, `readtime`, and `excerpt` extracted from the MDX frontmatter.
- Clicking a category tag updates the articles grid to show only posts matching that category.
- Typing into the search input filters list items immediately.

---

## Phase 3: Platform Editor Integration & Defensive Permissions (Gating)

### Goal
Wire up native immediately.run editing capabilities, checking filesystem read-only/read-write states defensively to respect the Zero-Chrome Principle for public readers.

### Step-by-Step Instructions
1. **Active Mode Check:**
   - Use `useContext(TinkerableContext)` to read `navigationState.mode`.
   - Determine if the app is currently in `'present'` mode or `'edit'` mode.
2. **Defensive Permission Check (Zero-Chrome):**
   - Query active workspace mounts using `useMounts()` or equivalent from `@immediately-run/sdk`.
   - If the active mount has `mode: "ro"` (or user is unauthenticated), strip all edit icons, save buttons, and configuration options from the DOM.
3. **Present-to-Edit Transition Button:**
   - If the active mount is `mode: "rw"` and the user is in `'present'` mode, show an elegant **"Edit Page" (✎)** button.
   - Clicking it calls `requestEdit({ path: currentPath })` from the SDK to transition the workbench to edit mode.
4. **Single-file Editing Task:**
   - If the user is in `'edit'` mode, display an inline edit affordance.
   - Clicking it calls the host's native `edit-file` task using the SDK `invokeTask('edit-file', { file: capFile(...) })` to open the file in the workspace CodeMirror editor.

### Exit Criteria
- In read-only mounts or guest sessions, the layout is perfectly clean with zero edit chrome.
- In read-write mode, clicking the "Edit Page" button transitions the workspace into edit mode.
- In edit mode, clicking the edit icon successfully opens the target MDX file in the platform's editor.

---

## Phase 4: Content Extensibility, Dynamic Imports & Asset Loading

### Goal
Enable the wiki to load dynamically from another mounted Space, support dynamic module resolution (`/mnt/{hash}/` imports) within the MDX pages, and resolve local assets such as images.

### Step-by-Step Instructions
1. **Dynamic Workspace Auto-Detection:**
   - On launch, check the query parameters (e.g. `?mount=space:xyz`) or local storage.
   - Scan mounted filesystems for a standard `blog-config.json` file. If present, load pages from that mount rather than the default in-repo path.
2. **Stable Mount Path Resolution for Dynamic Imports:**
   - MDX pages inside external spaces can import React components (`import Graph from './components/Graph'`). Let the immediately.run runtime compiler resolve these dynamically relative to the stable mount path `/mnt/{hash}/`.
3. **Binary Image Asset Loader:**
   - Implement an `<Image>` wrapper component for markdown images (`![alt](./images/photo.png)`):
     1. Read file bytes from the dynamic path.
     2. Convert the byte array into a `Blob`.
     3. Call `URL.createObjectURL(blob)` to get a secure local URL.
     4. Revoke the object URL on unmount.
4. **React `<ErrorBoundary>` fallbacks:**
   - Wrap MDX page renders and dynamically imported components in an `<ErrorBoundary>` block. If a dynamic component fails to load or resolves to a missing path, render a clean fallback card instead of crashing the app.

### Exit Criteria
- The blog successfully loads, indexes, and renders MDX files located on an external Space mount.
- Relative imports inside the external MDX pages resolve and render successfully.
- Relative image tags inside the external MDX files successfully display their graphic assets using the Blob URL loader.
- Deleting an imported component displays a clean error banner on that specific page instead of throwing a blank screen crash.

---

## Phase 5: Build, Linting & Self-Verification

### Goal
Guarantee complete code hygiene, Fast Refresh compliance, error-free production compilation, and seamless hot reloading.

### Step-by-Step Instructions
1. **Lint Check:**
   - Run `npm run lint`. Fix any errors, focusing heavily on Fast Refresh violations (e.g. no mixed component and helper named exports).
2. **Build Verification:**
   - Run `npm run build` using the project's rollup configuration. Fix any typescript or bundle compilation errors.
3. **Interactive Manual Test:**
   - Run `npm run dev` to boot locally.
   - Navigate pages, trigger search, click tags, and check layout transitions to ensure flawless operation.

### Exit Criteria
- `npm run lint` yields zero warnings and zero errors.
- `npm run build` successfully compiles and outputs bundle files under `build/` with no typescript or compilation errors.
