# Vue Design Lab

A poster-workbench scaffold for designers: drop a `.vue` file and get a poster, tweak
design tokens from a panel that writes straight back to source, export PNG / PDF in one
click. The bundled sample materials promote the brand itself — typeset in the official
Vue style, you learn HTML / CSS / Vue while making real things.

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

Open <http://localhost:5173> — three sample materials (brand rollup / product poster /
social square) are already inside.

## The three conventions

| Convention | How |
| --- | --- |
| Add a material | Create a `.vue` file under `src/pages/`; the filename becomes the route, no registration needed |
| Declare export size | On the page root element: `data-export data-export-w="850" data-export-h="2000"` (px) |
| Tune design tokens | Edit `--c-*` variables in the top-right panel; live preview, writes back to `src/styles/tokens.css` |

## Keep the look consistent

The visual contract ships with every scaffold as `DESIGN.md` next to your `package.json` —
feed it to your AI when vibe coding, and new pages keep the same character as the samples:
the Vue palette, the type hierarchy, and a list of banned patterns.

---

Maintaining this repository? The architecture, dev workflow, scaffolder testing, and
publishing steps live in [DEVELOPMENT.md](DEVELOPMENT.md).
