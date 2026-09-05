# Design System: Vue Design Lab

The visual contract for making new materials (by hand or with an AI): follow it and new
pages share the same character as the bundled samples.

## 1. Visual Theme & Atmosphere

A restrained dark print-table atmosphere: a near-black cool-gray canvas, a single Vue
green carrying every accent, and the brand gradient reserved for brand elements
(wordmark, footer bar, gradient orb, full-bleed square). Grouping comes from whitespace
and hairline dividers, not stroked card boxes. Materials are print — static, precise,
pixels are the deliverable. Density 4, variance 5, motion 2.

## 2. Color Palette & Roles

Everything goes through the CSS variables in `src/styles/tokens.css`. Never hard-code
colors inside a material.

- **Canvas near-black** `#12151C` (`--c-bg`) — material and workbench base; never pure black `#000000`
- **Panel gray** `#1B2029` (`--c-surface`) — cards, inputs, active states
- **Vue green** `#42D392` (`--c-accent`) — the only accent: CTAs, links, highlights, icons
- **Soft green** `#8CE6BD` (`--c-accent-soft`) — small English labels, secondary emphasis
- **Brand gradient** `#41D1A7 -> #647EFF` (`--c-brand-from` / `--c-brand-to`) — brand
  elements only: wordmark, footer bar, large gradient orb, full-bleed square; never as
  generic decoration
- **Primary text** `#F6F6F6` (`--c-text`) / **muted text** `#A8A8A8` (`--c-text-muted`)
- **Structure line** `rgba(246, 246, 246, 0.14)` — 1px dividers, card strokes

Constraints: one accent for the whole system (saturation < 80%); no purple, no neon
glows, no outer-glow shadows.

## 3. Typography Rules

- **Stack**: `'Inter Variable', 'PingFang SC', 'Microsoft YaHei', sans-serif`
  (Inter continues the official Vue brand face; the latin subset ships with the project,
  CJK falls back to system fonts if you write Chinese content)
- **Display headlines**: weight 800, track-tight (`-0.02em`), line-height 1.1–1.2
- **Labels / eyebrows**: uppercase, wide tracking `0.12em ~ 0.34em`, soft green or muted
- **Body**: 400–500, line-height 1.6–1.8, sized by `--fs-body`
- Hierarchy comes from **weight and color**, not from ever-larger sizes
- Banned: system serifs (Times/Georgia), decorative scripts, cramped display type

## 4. Component Stylings (material level)

- **Info blocks**: `border-top: 1px solid rgba(246,246,246,0.14)` divider plus whitespace
  above — no stroked card boxes; small headings in Vue green
- **Kicker pill**: `border-radius: 999px`, dark translucent fill (`rgba(18,21,28,0.5)`)
  with white wide-tracked text, or green fill with dark text
- **QR placeholder**: white fill + `--radius-card` corners, geometric canvas-color blocks inside
- **Footer brand bar**: full-width brand gradient with canvas-color bold text
- **Vue Logo**: use `src/components/VueLogo.vue`; pass colors via `outer` / `inner`;
  on dark backgrounds pass `var(--c-bg)` as inner for a cutout effect
- **Workbench buttons**: green fill, dark text, flat, no glow; hover shifts tone,
  active translates -1px

## 5. Layout Principles

- **Fixed canvas**: the material root declares `data-export` and
  `data-export-w / data-export-h` (px); output is 1:1, what you see is what prints
- Absolute positioning is fine inside materials (print logic); never in workbench UI
- The workbench stage uses `justify-content: safe center` so oversized materials stay
  reachable when the window is narrower than the canvas
- Prefer a single-column flow; no "three equal cards in a row" — use divider lists or
  an asymmetric grid instead
- One corner radius (`--radius-card`); spacing on an 8px rhythm

## 6. Motion & Interaction

- Materials are **static**: no animation (exported pixels must be stable)
- Workbench transitions only, `transition: 0.2s`, and only on
  `border-color / opacity / transform`
- Token panel previews live and writes back after a 350ms debounce — that is the only
  "motion" in the system

## 7. Anti-Patterns (banned)

- No emoji as icons (use SVG, e.g. `VueLogo`)
- No pure black `#000000`
- No purple, neon gradients, outer glows, or glow shadows
- The brand gradient is not generic decoration: when it appears, it means "Vue Design Lab"
- No three-equal-card rows; no stroked card boxes doing a divider's job
- No invented metrics (`99.9%`, `18k users` and friends never appear)
- No AI copywriting cliches: Elevate / Seamless / Unleash / Next-Gen
- No `LABEL // YEAR` typographic labels
- Display type must be track-tight; body labels wide-tracked — default tracking is a bug
- Hard-coded colors instead of tokens inside a material: a bug
