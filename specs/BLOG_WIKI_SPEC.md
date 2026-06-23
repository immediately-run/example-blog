# immediately.run Blog & Wiki — Customizable, extensible themeable MDX-based knowledge sharing

**Status:** proposal — initial draft for review · **Updated:** 2026-06-23

> **The single implementation-status source for this spec is `specs/status/BLOG_WIKI_STATUS.md`** — where this document and that one disagree, the status doc governs.

> **Reads first:** `core_concepts.md` §1 (App), §2 (Host), §4 (Principal), §7 (Resource), `EDITOR_FIRST_EDITING_SPEC.md` §1 (Principle), `CLAUDE.md` (Design system & Editing).

---

## 1. Vision & Core Philosophy *(normative)*

The Blog/Wiki is a high-fidelity, highly customizable, and themeable content platform designed to run natively as an immediately.run sandboxed app. It serves two primary audiences:
1. **Unauthenticated Public Readers:** Visitors who consume content in a clean, high-performance, distraction-free interface with absolutely zero editing chrome, zero credential popups, and instant search.
2. **Collaborative Team Contributors:** Small teams who share a workspace (such as a local directory or a platform-hosted collaborative Space) where every reader can become a writer at the click of an edit affordance.

Consistent with immediately.run's core product values, the app enforces **run-mode first** (visual styling, speed, and mobile responsiveness are never compromised for authoring features), **leveraging platform tools** (saving, versioning, conflict resolution, and text editing are delegated to the platform editor), and **first-class agent collaboration** (both content files and index structures are programmatically legible).

---

## 2. Content Storage & Workspace Options *(normative)*

To enable both stand-alone self-contained blogs and shared multi-tenant knowledge bases, the app resolves content from two distinct topologies:

### §2.1 In-Repo Content Topology
- **Location:** Inside the app's own git repository under `/app/pages/entries/**/*.mdx` (e.g. `example-blog`'s default entries).
- **Resolution:** Loaded via the immediately.run standard package resolution or dynamic imports.
- **Use Case:** Personal portfolios, technical documentation tied directly to code releases, static-first blogs.

### §2.2 External Mount Content Topology
- **Location:** Inside an external workspace mounted by the host filesystem, such as a **local directory** (`local:...`) or a collaborative team **Space** (`space:...`).
- **Resolution:** Path references resolve to secure absolute paths, e.g. `/mnt/{hash}/` or `/mnt/space:{space_id}/`.
- **Use Case:** High-churn team wikis, meeting notes, project trackers, shared brainstorming vaults.
- **Auto-Discovery:** On boot, the blog scans available mounts via the SDK for a conventional `blog-config.json` file at the root. If found, it automatically switches from in-repo mode to the external workspace.

---

## 3. Extensible MDX & Dynamic Module Imports *(normative)*

To deliver on the promise of infinite customizability and extensibility, MDX files within the blog/wiki are treated as first-class executable React components. They must be able to freely import styling, helper scripts, and other third-party JSX components from within the same workspace or space.

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      Mounted Workspace                      │
 │                     (/mnt/space:team-xyz/)                  │
 │                                                             │
 │  ┌──────────────────────────┐    ┌───────────────────────┐  │
 │  │        index.mdx         │    │  CustomCalculator.tsx │  │
 │  │                          │    │                       │  │
 │  │ import Calc from         ├─►──┤ export default const  │  │
 │  │   "./CustomCalculator";  │    │   Calc = () => ...    │  │
 │  └──────────────────────────┘    └───────────────────────┘  │
 └─────────────────────────────────────────────────────────────┘
```

### §3.1 Native Resolution of Stable Paths
immediately.run maps mounted filesystems to stable absolute paths in the sandboxed iframe's runtime environment (e.g., `/mnt/{hash}/`). 
- **Relative Imports:** Standard ES relative imports within an MDX file (e.g. `import InteractiveMap from './components/InteractiveMap.tsx'`) are resolved relative to the file's absolute path inside the `/mnt/{hash}/` boundary.
- **Absolute Imports:** If an MDX page needs to import global shared modules (e.g. a centralized theme helper or design system bundle), it can import directly using absolute paths: `import { Button } from "/mnt/{hash}/lib/ui.tsx"`.
- **Persistence Across Sessions:** Because filesystem hashes and Space IDs are stable, these absolute and relative imports resolve reliably across browser sessions, reboots, and hot reloads, provided the target filesystem is mounted with appropriate capabilities.

### §3.2 Dynamic Third-Party JSX Compilation
MDX content containing third-party JSX components is evaluated dynamically by the blog engine inside the iframe sandbox:
1. When a reader navigates to an MDX page, the blog engine requests the file's raw content.
2. The code is compiled by the browser-side compiler provided by immediately.run, preserving the import declarations.
3. The platform's dynamic bundler maps the resolved import paths (`/mnt/{hash}/...`) to the live, sandboxed filesystem.
4. If an import fails (e.g. a component file was deleted or the mount is missing), the blog wraps the page in a React `<ErrorBoundary>` container, rendering an elegant placeholder block while preserving the rest of the page layout.

---

## 4. The Gated Editing Experience & Editor Integration *(normative)*

In strict compliance with **`CLAUDE.md` §11** and **`EDITOR_FIRST_EDITING_SPEC`**, the blog does *not* include a built-in text-input or markdown editor. Instead, it relies on deep integration with immediately.run's native workbench editor:

```
┌────────────────────────────────────────────────────────────────┐
│  Blog / Wiki UI                                                │
│                                                                │
│  [ Title of Page ]                                             │
│  Written on June 23, 2026 • By Contributor [Edit Page ✎] ──────┼───┐
│                                                                │   │
│  This is MDX content being read inside the sandboxed iframe.   │   │
└────────────────────────────────────────────────────────────────┘   │
                                                                     │ (SDK Invoke)
┌────────────────────────────────────────────────────────────────┐   ▼
│  immediately.run Host Workbench (Active Overlay)              │   │
│                                                                │   │
│  ┌─ File: /mnt/space-xyz/entries/future-of-ai.mdx ──────────┐  │   │
│  │ ---                                                      │  │◄──┘
│  │ title: The Future of Artificial Intelligence             │  │
│  │ ---                                                      │  │
│  │ Exploring how AI is transforming creative workflows...   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### §4.1 Read-Only Experience (Zero-Chrome Principle)
- When the active workspace mount has read-only permissions (`mode: "ro"`), or when the user is unauthenticated, all edit affordances, buttons, and settings are stripped from the DOM.
- The user is presented with a pristine, uncluttered content view. Under no circumstances will a read-only reader be exposed to interactive controls that yield `EROFS` (Read-only file system) errors.

### §4.2 Actionable Editing Affordances
- When the workspace mount has write permissions (`mode: "rw"`), the app exposes a subtle **"Edit Entry" (✎)** button next to the title or section headers.
- Clicking the button requests single-file write delegation via the SDK and triggers the `edit-file` host task:
  ```ts
  import { invokeTask, capFile } from '@immediately-run/sdk';
  
  await invokeTask('edit-file', {
    file: capFile({ mountId: 'space:team-wiki', relPath: 'entries/future-of-ai.mdx' }, { mode: 'rw' }),
  });
  ```
- Any edits made in the platform editor trigger the browser's hot module reloading (HMR) flow, instantly updating the blog/wiki page view behind the editor overlay.

### §4.3 Structured Content Scaffolding
- To write a new post, authorized contributors click a **"New Entry"** button.
- The app requests title input, validates that the title does not collide with existing entries, and writes a skeleton template containing default frontmatter:
  ```markdown
  ---
  title: "A New Journey"
  date: June 23, 2026
  tags: []
  ---
  Type your contents here...
  ```
- The app immediately triggers the platform's `edit-file` task on the newly created file path.

---

## 5. Frontmatter Harvesting & Full-Text Search *(normative)*

To enable navigation, categorizations, and searching without a static backend, the Blog/Wiki app runs an active client-side metadata indexer:

### §5.1 Frontmatter Spec
Every blog post / wiki page is expected to begin with a standard frontmatter block:
```yaml
---
title: "Digital Wellness: Finding Balance in a Connected World"
date: "January 10, 2024"
readtime: "6 min read"
tags: [Lifestyle, Wellness]
excerpt: "Practical strategies for maintaining mental health and productivity while navigating our increasingly digital lives."
---
```

### §5.2 Client-Side Harvesting Engine
- **Local Indexer:** The engine queries files matching `/entries/**/*.mdx` (or custom paths specified in `blog-config.json`).
- **Lazy Metadata Scrape:** Instead of reading full files, the app reads only the first 500 bytes of each `.mdx` file to parse the frontmatter metadata block.
- **SDK Query Hook Integration:** For in-repo files, the app integrates with `@immediately-run/sdk` metadata queries:
  ```ts
  import { useMetadataQuery, useFileMetadata } from "@immediately-run/sdk/hooks";
  ```
- **In-Memory Search Index:** The parsed titles, tags, and excerpts are compiled into a lightweight client-side index. Full-text search filters this index instantly on the client, avoiding any remote API rounds.

---

## 6. Layouts & Design Tokens *(normative)*

The Blog/Wiki is built to follow the immediately.run project-specific brand design language specified in **`CLAUDE.md`**:

### §6.1 Aesthetics & UI
- **Canvas:** Cool near-black backdrop (`--bg` token) as default with near-white ink (`--ink`).
- **Accents:** Neon magenta-to-violet gradient (`--grad` token) for interactive links, category pills, and header details.
- **Typography:** Gabarito display family for headlines; Space Mono details for metadata, tags, and timestamps.
- **Borders:** Thin, elegant hairline borders (`--hairline` / `1px solid var(--panel)`).
- **Shadows:** Hard-offset solid block shadows on card hovers.
- **Copy:** Clean, modern sentence case. Headings terminate with a period (e.g. `Future of AI.`).
- **Icons:** Lucide icons sized to 16px–24px, using `currentColor`.
- **No Emojis:** The brand strictly forbids emojis in any layout files, page indexes, or templates.

---

## Decisions & Rejected Alternatives

- **Chose dynamic ES runtime imports over static build pre-rendering:**
  *Rationale:* Static site generation is impossible for arbitrary external workspace mounts loaded dynamically at runtime. Compiling and bundling MDX directly in the sandbox browser environment aligns with immediately.run's no-build runtime model, ensuring complete flexibility for forked themes and customized code blocks.
- **Chose `edit-file` task delegation over inline editor:**
  *Rationale:* Reinforces **Product Value 7** and **CLAUDE.md §11**. Minimizes bundle size, maximizes mobile editing responsiveness (handling soft keyboard viewport resizing), and gives users who fork their platform editor custom keybindings, tabs, and diagnostic panels across every blog they edit.
- **Chose stable path `/mnt/{hash}` resolution for imports:**
  *Rationale:* Storing modules in external collaborative spaces requires a stable import path. Because immediately.run guarantees stable virtual paths for mounts across session reboots, we can directly utilize ES imports inside MDX files without needing complex dynamic import proxies or virtual path mapping layers.

---

## Open Questions

1. **How should we handle unauthenticated asset fetching from protected Spaces?**
   - *Proposed Solution:* If a Space is private, unauthenticated readers cannot access it. Public blogs must reside either in public git repositories (In-Repo model) or inside public Spaces where read-access is explicitly open to public origins.
2. **What happens if a third-party JSX component imported inside the MDX requests a capability the parent blog app does not hold?**
   - *Proposed Solution:* Due to sandboxing, any imported JSX component runs strictly inside the Blog/Wiki app's sandbox. It can never exceed the capabilities granted to the Blog/Wiki app itself. If an imported component tries to invoke an unauthorized SDK task, it will safely reject with `forbidden`, protecting the user's host origin.
