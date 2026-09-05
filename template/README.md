# Vue Design Lab · Your Material Workbench

Typeset real materials (posters, rollup banners, social graphics) with HTML / CSS / Vue.
Change a token, change the design; export print-ready PNG / PDF in one click.

## Run it

```bash
pnpm install
pnpm dev
```

## How to add a new material

1. Create `src/pages/MyPoster.vue` under `src/pages/` (filename = route name)
1. Declare the canvas size on the root element:

   ```vue
   <div class="poster" data-export data-export-w="850" data-export-h="2000">
   ```

1. Typeset with the tokens from `src/styles/tokens.css` (`var(--c-accent)` and friends)
   instead of hard-coded colors — that is what lets the token panel drive your page

The page shows up on the home grid and in the top navigation automatically; the bottom
export bar produces PNG (2x), PDF, or browser print.

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
