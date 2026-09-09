import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The vue-design-lab dev plugin. Add it next to @vitejs/plugin-vue in the
 * HOST vite config:
 *
 *   import vue from '@vitejs/plugin-vue'
 *   import { lab } from 'vue-design-lab/vite'
 *   export default defineConfig({ plugins: [vue(), lab()] })
 *
 * It provides:
 * - GET/PUT /__tokens - read/write the host's src/styles/tokens.css (AUTO block only)
 * - POST /__pages    - materialize a starter into the host's src/pages/
 * - optimizeDeps exclusion so this source-form package never gets pre-bundled
 *
 * This file is plain JavaScript on purpose: vite.config imports run through
 * Node's native loader, which refuses to type-strip .ts files under
 * node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING). Types for
 * editors live in the sibling vite-plugin.d.ts.
 *
 * All file paths resolve against the host project root; the starter formats
 * ship with the package and are read from here.
 */

// Markers must stay self-closed complete comments, so a rewrite can never
// swallow the variable block into a comment
const START = '/* AUTO:TOKENS:START */'
const END = '/* AUTO:TOKENS:END */'

const DEFAULT_TOKENS = `/* Your design tokens. The panel edits only the block between the markers;
   anything outside is yours and is never rewritten. */

${START}
:root {
  --c-bg: #12151C;
  --c-surface: #1B2029;
  --c-accent: #42D392;
  --c-accent-soft: #8CE6BD;
  --c-brand-from: #41D1A7;
  --c-brand-to: #647EFF;
  --c-text: #F6F6F6;
  --c-text-muted: #A8A8A8;
  --fs-title: 86px;
  --fs-body: 38px;
  --radius-card: 16px;
}
${END}
`

/** Parse the CSS variables inside the auto block of tokens.css */
function readTokens(tokensFile) {
  const css = readFileSync(tokensFile, 'utf8')
  const block = css.slice(css.indexOf(START) + START.length, css.indexOf(END))
  const vars = {}
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[m[1]] = m[2].trim()
  }
  return vars
}

/** Write the variables back into the auto block (between markers only) */
function writeTokens(tokensFile, vars) {
  const css = readFileSync(tokensFile, 'utf8')
  const s = css.indexOf(START)
  const e = css.indexOf(END)
  if (s < 0 || e < 0 || e < s) throw new Error('tokens.css is missing its AUTO:TOKENS markers')
  const body = `\n:root {\n${Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')}\n}\n`
  writeFileSync(tokensFile, css.slice(0, s) + START + body + css.slice(e))
}

/** Validate token keys and values: reject invalid entries with a reason, never drop silently */
function validateTokens(vars) {
  const clean = {}
  for (const [k, v] of Object.entries(vars)) {
    if (!/^--[\w-]+$/.test(k)) throw new Error(`invalid variable name: ${k}`)
    if (typeof v !== 'string') throw new Error(`${k}: value must be a string`)
    const val = v.trim()
    if (val.length === 0 || val.length >= 64) throw new Error(`${k}: value must be 1-63 chars`)
    // ; { } would break the declaration/rule structure of tokens.css - always reject
    if (/[;{}]/.test(val)) throw new Error(`${k}: value must not contain ; { }`)
    clean[k] = val
  }
  return clean
}

/** mm -> px at the given DPI */
function mmToPx(mm, dpi) {
  return Math.round((mm / 25.4) * dpi)
}

/** Blank starter page at an explicit canvas size */
function blankSource(w, h, target) {
  return `<!-- Created via the Templates page -> ${target} (${w}x${h}px) -->
<template>
  <div class="page" data-export data-export-w="${w}" data-export-h="${h}" style="width: ${w}px; height: ${h}px">
    <div class="inner">
      <VueLogo :size="72" inner="var(--c-bg)" />
      <h1>New material</h1>
      <p class="sub">Edit ${target} - full canvas is ${w} x ${h}px</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueLogo from 'vue-design-lab/components/VueLogo.vue'
</script>

<style scoped>
.page {
  background: var(--c-bg);
  color: var(--c-text);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
}
h1 {
  color: #fff;
  font-size: calc(var(--fs-title) * 0.5);
  font-weight: 800;
  letter-spacing: -0.02em;
}
.sub {
  color: var(--c-text-muted);
  font-size: calc(var(--fs-body) * 0.5);
}
</style>
`
}

/**
 * Materialize a starter at a (possibly different) canvas size:
 * rewrite the data-export dimensions, inject an inline width/height that
 * overrides the starter's scoped CSS, and retarget package imports (the file
 * moves from this package into the host's src/pages/).
 */
function createSource(templatesDir, templateId, w, h, target) {
  if (templateId === 'Blank') return blankSource(w, h, target)
  let src = readFileSync(resolve(templatesDir, `${templateId}.vue`), 'utf8')
  src = src.replace(/data-export-w="\d+"/, `data-export-w="${w}"`)
  src = src.replace(/data-export-h="\d+"/, `data-export-h="${h}"`)
  src = src.replace(/<([a-z][a-z0-9]*[^>]*?data-export[^>]*?)(\/?)>/, (_m, head, selfClose) => {
    return `<${head} style="width: ${w}px; height: ${h}px"${selfClose}>`
  })
  src = src.replace(/'@\//g, "'vue-design-lab/")
  return `<!-- Created from template ${templateId} -> ${target} (${w}x${h}px) -->\n${src}`
}

export function lab() {
  let root = process.cwd()
  let tokensFile = ''
  let pagesDir = ''
  // starter formats ship with this package (src/templates next to this file)
  const templatesDir = fileURLToPath(new URL('./templates', import.meta.url))

  return {
    name: 'vue-design-lab',
    apply: 'serve',
    config() {
      // this package is consumed as source via link:/workspace installs -
      // never let Vite pre-bundle it (esbuild cannot handle .vue)
      return { optimizeDeps: { exclude: ['vue-design-lab'] } }
    },
    configResolved(config) {
      root = config.root
      tokensFile = resolve(root, 'src/styles/tokens.css')
      pagesDir = resolve(root, 'src/pages')
      if (!existsSync(tokensFile)) {
        mkdirSync(dirname(tokensFile), { recursive: true })
        writeFileSync(tokensFile, DEFAULT_TOKENS)
      }
    },
    configureServer(server) {
      // ---------- token API ----------
      server.middlewares.use('/__tokens', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ vars: readTokens(tokensFile) }))
          return
        }
        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', () => {
            try {
              const { vars } = JSON.parse(body)
              // Merge with on-disk values: the panel only sends the keys it knows,
              // a full replacement would clobber tokens added elsewhere
              writeTokens(tokensFile, { ...readTokens(tokensFile), ...validateTokens(vars) })
              res.statusCode = 200
              res.end('ok')
            } catch (err) {
              console.warn('[tokens] PUT rejected:', String(err))
              res.statusCode = 400
              res.end(err instanceof Error ? err.message : String(err))
            }
          })
          return
        }
        res.statusCode = 405
        res.end()
      })

      // ---------- page factory ----------
      server.middlewares.use('/__pages', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          try {
            const { name, template, unit, dpi, w, h, asDir } = JSON.parse(body)
            // PascalCase keeps generated files import-safe and traversal-proof
            if (!/^[A-Z][A-Za-z0-9]{0,39}$/.test(String(name))) {
              throw new Error('name must be PascalCase letters/digits, e.g. MyPoster')
            }
            if (template !== 'Blank' && !existsSync(resolve(templatesDir, `${template}.vue`))) {
              throw new Error(`unknown template: ${template}`)
            }
            if (unit !== 'px' && unit !== 'mm') throw new Error('unit must be px or mm')
            const dpiNum = Math.trunc(Number(dpi))
            if (unit === 'mm' && !(dpiNum >= 24 && dpiNum <= 1200)) {
              throw new Error('dpi must be 24-1200')
            }
            const toPx = (v) => (unit === 'mm' ? mmToPx(Number(v), dpiNum) : Math.round(Number(v)))
            const pxW = toPx(w)
            const pxH = toPx(h)
            if (!(pxW >= 16 && pxW <= 20000) || !(pxH >= 16 && pxH <= 20000)) {
              throw new Error('canvas must resolve to 16-20000 px per side')
            }
            const file = asDir ? resolve(pagesDir, String(name), 'index.vue') : resolve(pagesDir, `${name}.vue`)
            // collide with either shape
            if (
              existsSync(file) ||
              existsSync(resolve(pagesDir, `${name}.vue`)) ||
              existsSync(resolve(pagesDir, String(name), 'index.vue'))
            ) {
              throw new Error(`src/pages already contains "${name}"`)
            }
            const target = `src/${relative(root, file)}`
            mkdirSync(dirname(file), { recursive: true })
            writeFileSync(file, createSource(templatesDir, String(template), pxW, pxH, target))
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ route: `/${name}` }))
          } catch (err) {
            console.warn('[pages] POST rejected:', String(err))
            res.statusCode = 400
            res.end(err instanceof Error ? err.message : String(err))
          }
        })
      })
    },
  }
}
