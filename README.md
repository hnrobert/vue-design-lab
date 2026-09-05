# Vue Design Lab

A poster-workbench scaffold for designers: drop a `.vue` file and get a poster, tweak
design tokens from a panel that writes straight back to source, export PNG / PDF in one
click. The bundled sample materials are typeset in the official Vue style — learn
HTML / CSS / Vue while making real things.

## Quick start

```bash
pnpm create vue-design-lab my-lab
# or
npm create vue-design-lab@latest my-lab
```

```bash
cd my-lab
pnpm install
pnpm dev
```

Open <http://localhost:5173> — three sample materials (rollup banner / A4 poster /
social square) are already inside.

## The three conventions

| Convention | How |
| --- | --- |
| Add a material | Create a `.vue` file under `src/pages/`; the filename becomes the route, no registration needed |
| Declare export size | On the page root element: `data-export data-export-w="850" data-export-h="2000"` (px) |
| Tune design tokens | Edit `--c-*` variables in the top-right panel; live preview, writes back to `src/styles/tokens.css` |

The visual contract ships with every scaffold as [DESIGN.md](template/DESIGN.md) — feed
it to your AI when vibe coding, and new pages keep the same look as the samples.

## Repository layout (for maintainers)

```text
.
├── index.mjs            # create-vue-design-lab CLI (copies template, renames package)
├── package.json         # the CLI package itself; pnpm dev / build proxy into template
└── template/            # the workbench app (distributed as-is by the scaffolder)
    ├── DESIGN.md        # design system: Vue palette, type rules, banned patterns
    └── src/
        ├── pages/       # material pages: one .vue per poster
        ├── components/  # TokenPanel / ExportBar / VueLogo
        ├── export/      # PNG / PDF / print export
        └── styles/      # tokens.css (with the auto-written block) + base.css
```

```bash
pnpm install     # install the whole workspace from the repo root
pnpm dev         # run the template dev server
pnpm build       # type-check + build the template
```

## Publishing

`npm publish` (from the repo root) publishes the `create-vue-design-lab` package; after
that `npm create vue-design-lab <dir>` works for everyone. `prepublishOnly` builds the
template first so a broken template can never ship.
