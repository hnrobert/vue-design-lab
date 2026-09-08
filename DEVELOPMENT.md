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
        ├── pages/         # user work files, auto-routed: Name.vue or Name/index.vue
        ├── templates/     # starter formats - previews only on /templates, never routed
        ├── views/         # Home (material list) + Templates (gallery + create form)
        ├── components/    # StageZoom / TemplatePreview / TokenPanel / ExportBar / VueLogo
        ├── utils/         # plain helpers (export.ts: PNG / PDF / print)
        ├── router/        # auto routing via import.meta.glob (two page shapes)
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

`src/router/index.ts` globs `src/pages/` with `import.meta.glob` in two shapes —
`pages/*.vue` (single file) and `pages/*/index.vue` (folder) — plus the static `/` and
`/templates` routes. Route name = filename or folder name; routes sort alphabetically.
No registration anywhere — dropping a file in is the whole workflow. The starters in
`src/templates/` are deliberately outside the glob: they only render as scaled previews
inside the Templates gallery.

Each starter declares its canonical size in `src/templates/meta.ts`: physical formats
(cards, A4/A5, rollup) speak mm at a design DPI, screen formats speak px. The shipped
files are 1:1 with their metadata — creating with the prefilled defaults reproduces the
template canvas exactly (e.g. rollup 850x2000mm @72dpi = 2409x5669px).

### Export protocol

A material self-declares its canvas on the root element:

```vue
<div class="poster" data-export data-export-w="850" data-export-h="2000">
```

`src/utils/export.ts` finds the `[data-export]` node and renders it with
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

### Page factory (`POST /__pages`)

Also in `vite.config.ts` (`pagesDevPlugin`, dev-only): the Templates page posts
`{ name, template, unit, dpi, w, h, asDir }` and the middleware writes a real file into
`src/pages/` — either `Name.vue` or `Name/index.vue`. Validation: PascalCase name
(6..40 chars, also traversal-proof), known template id or `Blank`, unit px/mm, DPI
24-1200, canvas resolving to 16-20000 px per side, collision check across both shapes.
mm converts at the given DPI (`px = mm / 25.4 * dpi`). Template materialization rewrites
the `data-export-w/h` attributes and injects an inline `width/height` that overrides the
template's scoped CSS, plus a provenance comment at the top. After a successful POST the
client does a full navigation, so the fresh glob includes the new route.

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

Publishing is release-driven: draft a GitHub Release with a tag like `v0.1.1`, and
`.github/workflows/publish.yml` stamps the tag into `package.json`, runs the hygiene
gate plus the scaffolder e2e, and publishes to npm via **OIDC trusted publishing** —
no tokens, no secrets, with provenance attestation. CI (`.github/workflows/ci.yml`)
gates every push/PR with the same build + e2e.

First-time setup (once per package, before the workflow can publish):

1. `npm publish` locally once so `create-vue-design-lab` exists under the account
   (bootstrap `0.1.0`; start releasing from `v0.1.1` to avoid the collision)
2. npmjs.com -> package -> Settings -> **Trusted Publishers** -> bind this repository
   with workflow file `publish.yml`

Until step 2 is done, the workflow's publish step fails with a 403 — that is expected
for the very first release. After publishing, `npm create vue-design-lab <dir>`
serves the new version.

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
- **Scaffolded copies ship without a lockfile, on purpose.** The CLI rewrites the
  package name, so a copied `pnpm-lock.yaml` no longer matches `package.json` — local
  `pnpm install` silently rewrites it, but CI (where pnpm auto-enables
  `--frozen-lockfile`) hard-fails with `ERR_PNPM_OUTDATED_LOCKFILE`. CI needs a missing
  lockfile allowed explicitly too, hence `pnpm install --no-frozen-lockfile` in the
  e2e steps. The repo's `template/pnpm-lock.yaml` is git-ignored so a stray one can
  never sneak back into the tarball.
