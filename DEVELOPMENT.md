# Developing vue-design-lab

Maintainer guide for the `create-vue-design-lab` repository. User-facing docs live in
[README.md](README.md); the scaffolded app gets its own manual and `DESIGN.md` from
`template/`.

## Prerequisites

- Node.js >= 20
- pnpm >= 10 (`corepack enable pnpm`)

## Repository layout

```text
.
├── index.mjs              # create-vue-design-lab CLI: copy template, rename package, write .gitignore
├── package.json           # the CLI package; root pnpm dev / build proxy into template
├── pnpm-workspace.yaml    # workspace root; allowBuilds for esbuild / core-js
└── template/              # the workbench app, distributed as-is by the scaffolder
    ├── DESIGN.md          # design system: Vue palette, type rules, banned patterns
    ├── README.md          # the manual scaffolded users read
    ├── pnpm-workspace.yaml  # pnpm config for standalone installs (allowBuilds)
    └── src/
        ├── pages/         # material pages: one .vue per format, auto-routed, sorted alphabetically
        ├── views/Home.vue # landing page (auto-lists material pages)
        ├── components/    # TokenPanel / ExportBar / VueLogo
        ├── export/        # PNG / PDF / print export
        ├── router/        # auto routing via import.meta.glob
        └── styles/        # tokens.css (auto-written block) + base.css
```

## Daily workflow

```bash
pnpm install     # install the whole workspace from the repo root
pnpm dev         # run the template dev server
pnpm build       # vue-tsc type-check + vite build of the template
```

All three commands run at the repo root and proxy into `template/`.

## How the app works

### Auto routing

`src/router/index.ts` globs `src/pages/*.vue` with `import.meta.glob`; filename =
route name. No registration anywhere — dropping a file in is the whole workflow.

### Export protocol

A material self-declares its canvas on the root element:

```vue
<div class="poster" data-export data-export-w="850" data-export-h="2000">
```

`src/export/useExport.ts` finds the `[data-export]` node and renders it with
html-to-image (PNG, `pixelRatio` = scale) or embeds the raster into a jsPDF page sized
from the logical dimensions (96dpi base). Browser print injects a matching `@page` and
relies on the print rules in `base.css` to hide the workbench UI.

### Token write-back

`template/vite.config.ts` registers a dev-only middleware (`apply: 'serve'`):

- `GET /__tokens` — parse the CSS variables inside the `AUTO:TOKENS` markers
- `PUT /__tokens` — validate, merge with on-disk values, rewrite only the block
  between the markers (the handwritten zone is never touched)

Validation rejects bad keys, non-strings, empty or >=64-char values, and any value
containing `; { }` (which would corrupt the stylesheet structure) — with an error
message, never a silent drop. The panel shows the error when a write is rejected.

Writing the file triggers Vite HMR, which is the persistence mechanism: edits become
source-visible and git-diffable.

## Testing the scaffolder

Smoke test the CLI against the live template:

```bash
node index.mjs /tmp/lab-smoke
node index.mjs /tmp/lab-smoke --force   # rebuild a non-empty target
```

Full end-to-end (what CI should do before every publish):

```bash
rm -rf /tmp/lab-e2e
node index.mjs /tmp/lab-e2e
cd /tmp/lab-e2e && pnpm install && pnpm build
```

If that build is green, the template is self-sufficient: correct dependencies,
pnpm config, and type-checking all ship correctly.

## Package hygiene

`npm pack --dry-run` must contain only `index.mjs`, `README.md`, `package.json`, and
`template/**` — no `node_modules`, no `dist`, no `*.tsbuildinfo`. The `files` allowlist
in `package.json` enforces this with `!` exclusions; check it after any layout change.

`prepublishOnly` builds the template first, so a broken template cannot ship.

## Publishing

```bash
npm publish
```

Bump `version` in the root `package.json` first. After publishing,
`npm create vue-design-lab <dir>` serves the new version.

## Gotchas learned the hard way

- **pnpm >= 10 blocks install scripts** (`esbuild`, `core-js`) unless allowlisted. The
  root workspace file covers repo development; `template/pnpm-workspace.yaml` ships the
  same allowlist so scaffolded copies install cleanly.
- **`vite.config.ts` uses Node APIs** (`node:fs`, middleware types, `__dirname`), so
  `@types/node` is a required devDependency of the template.
- **Do not trust a green build after only config changes**: `tsconfig.tsbuildinfo`
  incremental caching can skip re-checking unchanged files and hide type errors.
  Delete `template/tsconfig.tsbuildinfo` before trusting a build (the missing
  `@types/node` above shipped invisibly this way).
- **The Inter font is latin-subset only** via a hand-written `@font-face` in
  `base.css` pointing into `@fontsource-variable/inter/files`. CJK text falls back to
  system fonts — do not "fix" this to full coverage; it keeps export-time font
  inlining light.
