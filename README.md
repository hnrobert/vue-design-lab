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

Open <http://localhost:5173> — your material list starts empty; the Templates page has
eight branded starters (business card, A4/A5 posters, rollup banner, 16:9 slide, social
square / link card / story, plus a blank canvas) ready to materialize into real files.

## The three conventions

| Convention | How |
| --- | --- |
| Add a material | On the Templates page: pick a starter, set size in px or mm + DPI, choose single file or folder — the .vue file is written into `src/pages/` for real |
| Declare export size | On the page root element: `data-export data-export-w="850" data-export-h="2000"` (px) |
| Tune design tokens | Edit `--c-*` variables in the top-right panel; live preview, writes back to `src/styles/tokens.css` |

## Keep the look consistent

The visual contract ships with every scaffold as `DESIGN.md` next to your `package.json` —
feed it to your AI when vibe coding, and new pages keep the same character as the samples:
the Vue palette, the type hierarchy, and a list of banned patterns.

---

Maintaining this repository? The architecture, dev workflow, scaffolder testing, and
publishing steps live in [DEVELOPMENT.md](DEVELOPMENT.md).
