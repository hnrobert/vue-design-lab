# vue-design-lab

The Vue Design Lab workbench as an installable library. Consume it, drop
`.vue` files into `src/pages/`, and you have a material studio: auto routing,
a token panel that writes back to source, pinch-zoom stage, and one-click
PNG / PDF export.

## Use it

```bash
pnpm create vue-design-lab my-lab   # scaffolds a host app wired to this package
```

Or wire an existing Vite + Vue app by hand:

```ts
// main.ts
import { createLab } from 'vue-design-lab'
import './styles/tokens.css'
createLab().mount('#app')
```

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { lab } from 'vue-design-lab/vite'

export default defineConfig({ plugins: [vue(), lab()] })
```

`vue` and `vue-router` are peer dependencies; `lab()` provides the dev-only
token and page-factory APIs and keeps this package out of `optimizeDeps` (it
ships as source — hosts compile the SFCs with their own Vite).

Conventions, gestures, and the design contract are documented in the host
scaffold (`host-template/README.md` and `DESIGN.md` in the repository).
