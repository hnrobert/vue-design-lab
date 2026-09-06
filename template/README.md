# Vue Design Lab · Your Material Workbench

Typeset real materials (posters, rollup banners, social graphics) with HTML / CSS / Vue.
Change a token, change the design; export print-ready PNG / PDF in one click.

## Run it

```bash
pnpm install
pnpm dev
```

## How to add a new material

The easiest way is the **Templates** page (top nav): pick a starter or a blank canvas,
set width/height in px or mm (mm takes a DPI), choose the file shape, and hit Create.
The workbench writes a real .vue file into `src/pages/` and routes it — no registration,
the file is yours to edit from there on.

Materials live under `src/pages/` in either shape:

```text
src/pages/MyPoster.vue           # single file -> /MyPoster
src/pages/MyPoster/index.vue     # folder      -> /MyPoster
```

Or just create one by hand with the canvas declared on the root element:

```vue
<div class="poster" data-export data-export-w="850" data-export-h="2000">
```

The starter formats themselves sit in `src/templates/` and are never routed — they only
appear as previews on the Templates page.

Whatever route you take: typeset with the tokens from `src/styles/tokens.css`
(`var(--c-accent)` and friends) instead of hard-coded colors — that is what lets the
token panel drive your page. The bottom export bar produces PNG (2x), PDF, or browser
print.

## Canvas gestures

The stage is a pan/zoom viewport: it opens with the whole material fitted to view.

- Pinch (trackpad) or ctrl/cmd + wheel to zoom, anchored at the cursor
- Two-finger scroll or drag to pan
- The pill at the bottom left: zoom out, click the percentage to reset to 100%,
  zoom in, or hit Fit
- Every page change re-fits; zooming never affects export — output is always 1:1

## Design tokens

Open the panel via the icon at the top right: colors get a picker, px values get a
slider. Edits preview instantly and are written back to the `AUTO:TOKENS` block in
`src/styles/tokens.css` after a 350ms debounce — source-level persistence, visible to
git, easy to revert. The handwritten zone outside the markers is never touched.

## Visual rules

Before making a new material (or asking an AI to), read [DESIGN.md](DESIGN.md): the Vue
palette, type hierarchy, component styles, and a list of banned patterns. Follow it and
the result matches the bundled samples.

## Export notes

- PNG defaults to 2x (~192 DPI); raise `scale` in `src/components/ExportBar.vue` for more
- PDF pages are sized from the logical dimensions (96dpi base) with a raster embed
- Browser print injects a matching `@page`; the workbench UI hides itself automatically
