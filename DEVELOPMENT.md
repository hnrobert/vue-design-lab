# Developing vue-design-lab

Maintainer guide for the `vue-design-lab` repository, which publishes two npm
packages (the repo name and package names are independent — `npm create`
resolves packages, not repos):

- **`vue-design-lab`** (`template/`) — the workbench as an installable library:
  shell app, components, starters, and the dev-plugin.
- **`create-vue-design-lab`** (repo root) — the CLI that scaffolds a host app
  consuming that library.

User-facing docs live in [README.md](README.md); a scaffolded host gets its own
manual and `DESIGN.md` from `host-template/`.

## Prerequisites

- Node.js >= 20
- pnpm >= 10 (`corepack enable pnpm`)

## Repository layout

```text
.
├── index.mjs              # create-vue-design-lab CLI: copy host scaffold, rewrite name + lab dep
├── package.json           # the CLI package; root pnpm dev / build proxy into template
├── pnpm-workspace.yaml    # workspace root; allowBuilds for esbuild / core-js
├── host-template/         # the host app scaffold the CLI copies
│   ├── DESIGN.md          # design system: Vue palette, type rules, banned patterns
│   ├── README.md          # the manual scaffolded users read
│   └── src/
│       ├── main.ts        # createLab().mount('#app') - the entire host app
│       ├── pages/         # user materials (gitkeep only here)
│       └── styles/tokens.css  # per-host tokens with the AUTO:TOKENS block
└── template/              # the vue-design-lab LIBRARY (published as its own package)
    ├── package.json       # exports map, peer vue/vue-router, source-form (no build)
    └── src/
        ├── index.ts       # createLab(): app + router + base styles
        ├── vite-plugin.ts # lab(): /__tokens + /__pages middleware, optimizeDeps exclude
        ├── router/        # globs the HOST's /src/pages via leading-slash globs
        ├── templates/     # starter formats - previews only on /templates, never routed
        ├── views/         # Home (material list) + Templates (gallery + create form)
        ├── components/    # StageZoom / TemplatePreview / TokenPanel / ExportBar / VueLogo
        ├── utils/         # plain helpers (export.ts, fonts.ts)
        └── styles/base.css  # font + reset + print rules (imported by the lib entry)
```

## Daily workflow

```bash
pnpm install     # install the whole workspace from the repo root
pnpm build       # vue-tsc type-check of the library
```

The root `devDependencies` (`vite`, `@vitejs/plugin-vue`, `@types/node`, plus
`vue-design-lab: workspace:*`) exist so that `host-template/` — which has no
node_modules of its own in this repo — resolves `vite/client` and its imports
in editors and in `vue-tsc -p ../host-template/tsconfig.json`. They never ship:
npm pack excludes devDependencies.

The library ships no demo app of its own — develop against a real host linked
to the local source (see below); edits to `template/src` show up there through
the symlink on the next dev-server reload.

The library ships no demo app of its own — develop against a real host linked
to the local source (see below); edits to `template/src` show up there through
the symlink on the next dev-server reload.

### The linked-host dev loop

```bash
node index.mjs ../my-lab --lab "link:$(pwd)/template"
cd ../my-lab && pnpm install && pnpm dev
```

`link:` symlinks the library into the host's node_modules, so template edits
are live. The lab plugin excludes `vue-design-lab` from `optimizeDeps` itself —
that is what allows source-form .vue files in a dependency.

## How the library works

### Host contract

A host is four files: `index.html`, `src/main.ts` (`createLab().mount('#app')`
plus its own `tokens.css` import), `vite.config.ts` (`vue()` + `lab()`), and
`src/pages/`. Everything else ships with the package.

### Auto routing

`src/router/index.ts` globs the HOST's pages with leading-slash globs
(`/src/pages/*.vue`, `/src/pages/*/index.vue`) — leading slashes resolve
against the Vite root, which is the host. Route name = filename or folder name;
routes sort alphabetically. The starters in the package's `src/templates/` are
outside the glob: they only render as scaled previews in the Templates gallery.

Each starter declares its canonical size in `src/templates/meta.ts`: physical
formats (cards, A4/A5, rollup) speak mm at a design DPI, screen formats speak
px. The shipped files are 1:1 with their metadata — creating with the prefilled
defaults reproduces the template canvas exactly (e.g. rollup 850x2000mm @72dpi
= 2409x5669px).

### Export protocol

A material self-declares its canvas on the root element:

```vue
<div class="poster" data-export data-export-w="850" data-export-h="2000">
```

`src/utils/export.ts` finds the `[data-export]` node and renders it with
html-to-image (PNG, `pixelRatio` = scale) or embeds the raster into a jsPDF page
sized from the logical dimensions (96dpi base). Browser print injects a matching
`@page` and relies on the print rules in `base.css` to hide the workbench UI.

### Token write-back (`GET/PUT /__tokens`)

In `src/vite-plugin.ts` (dev-only): paths resolve against the host root. GET
parses the CSS variables inside the `AUTO:TOKENS` markers of the host's
`src/styles/tokens.css` (created with defaults if missing); PUT validates,
merges with on-disk values, and rewrites only the block between the markers.

Validation rejects bad keys, non-strings, empty or >=64-char values, and any
value containing `; { }` (which would corrupt the stylesheet structure) — with
an error message, never a silent drop. The panel shows the error when a write
is rejected. Writing the file triggers Vite HMR, which is the persistence
mechanism: edits become source-visible and git-diffable.

### Page factory (`POST /__pages`)

Same plugin: the Templates page posts
`{ name, template, unit, dpi, w, h, asDir }` and the middleware writes a real
file into the HOST's `src/pages/` — either `Name.vue` or `Name/index.vue`.
Validation: PascalCase name, known template id or `Blank`, unit px/mm, DPI
24-1200, canvas resolving to 16-20000 px per side, collision check across both
shapes. mm converts at the given DPI (`px = mm / 25.4 * dpi`). Materialization
rewrites the `data-export-w/h` attributes, injects an inline `width/height`
that overrides the starter's scoped CSS, retargets `'@/` imports to
`'vue-design-lab/` (the file moves from package to host), and adds a
provenance comment. After a successful POST the client does a full navigation,
so the fresh glob includes the new route.

## Testing the scaffolder

Smoke test the CLI against the live host template:

```bash
node index.mjs /tmp/lab-smoke --lab "link:$(pwd)/template"
node index.mjs /tmp/lab-smoke --force   # rebuild a non-empty target
```

Full end-to-end (what CI does before every publish) — use `file:` so the copy
is self-contained even before the library exists on npm:

```bash
rm -rf /tmp/lab-e2e
node index.mjs /tmp/lab-e2e --lab "file:$(pwd)/template"
cd /tmp/lab-e2e && pnpm install --no-frozen-lockfile && pnpm build
```

If that build is green, the host scaffold and library are self-sufficient.

## Package hygiene

`npm pack --dry-run` at the root must contain only `index.mjs`, `README.md`,
`package.json`, and `host-template/**` — no `node_modules`, no lockfiles, no
`*.tsbuildinfo`. The `files` allowlist in `package.json` enforces this; check
it after any layout change.

Test pages inside `host-template/src/pages/` are caught by the publish
workflow's hygiene gate (only `.gitkeep` may ship).

## Publishing

Release-driven: a GitHub Release publishes BOTH packages via OIDC trusted
publishing (`.github/workflows/publish.yml`) — the library first (hosts depend
on it), then the CLI. Both need their own one-time setup:

1. `npm publish` each package locally once so it exists under the account
   (bootstrap `0.1.0`; start releasing from `v0.1.1`)
2. npmjs.com -> package -> Settings -> **Trusted Publishers** -> bind this
   repository (library: workflow `publish.yml` + path `template/`; CLI: root)

Until the bindings exist the publish steps fail with a 403 — expected for the
very first release. After publishing, `npm create vue-design-lab <dir>` serves
the new version.

## Gotchas learned the hard way

- **The library is consumed as source** (`link:`/`workspace:` installs, or the
  files allowlist when packed). Never add a build step that emits JS — hosts
  compile the .vue/.ts through their own Vite. The `lab()` plugin excludes the
  package from `optimizeDeps` so esbuild never tries to pre-bundle .vue files.
- **`./vite` must stay plain `.mjs`**: vite.config imports are externalized and
  loaded by Node's native loader, which refuses to type-strip `.ts` under
  node_modules (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` — invisible with
  `link:` installs, fatal with `file:`/npm installs). Its editor types live in
  the sibling `vite-plugin.d.mts` (the `.d.mts` extension is what bundler
  resolution pairs with `.mjs`).
- **pnpm >= 10 blocks install scripts** (`esbuild`, `core-js`) unless
  allowlisted. The root workspace file covers repo development;
  `host-template/pnpm-workspace.yaml` ships the same allowlist so scaffolded
  hosts install cleanly.
- **`vite-plugin.ts` uses Node APIs** (`node:fs`, middleware types), so
  `@types/node` is a required devDependency of the library.
- **Do not trust a green build after only config changes**: `tsconfig.tsbuildinfo`
  incremental caching can skip re-checking unchanged files and hide type errors.
  Delete `template/tsconfig.tsbuildinfo` before trusting a build.
- **Scaffolded copies ship without a lockfile, on purpose.** The CLI rewrites
  the package name, so a copied `pnpm-lock.yaml` no longer matches
  `package.json` — local `pnpm install` silently rewrites it, but CI (where
  pnpm auto-enables `--frozen-lockfile`) hard-fails with
  `ERR_PNPM_OUTDATED_LOCKFILE`. CI needs a missing lockfile allowed explicitly
  too, hence `pnpm install --no-frozen-lockfile` in the e2e steps.
- **The Inter font is latin-subset only** via a hand-written `@font-face` in
  `base.css` pointing into `@fontsource-variable/inter/files`. CJK text falls
  back to system fonts — do not "fix" this to full coverage; it keeps
  export-time font inlining light.
