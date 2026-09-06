import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

const TOKENS_FILE = resolve(__dirname, 'src/styles/tokens.css')
const PAGES_DIR = resolve(__dirname, 'src/pages')
const TEMPLATES_DIR = resolve(__dirname, 'src/templates')
// Markers must stay self-closed complete comments, so a rewrite can never swallow
// the variable block into a comment
const START = '/* AUTO:TOKENS:START */'
const END = '/* AUTO:TOKENS:END */'

/** Parse the CSS variables inside the auto block of tokens.css */
function readTokens(): Record<string, string> {
  const css = readFileSync(TOKENS_FILE, 'utf8')
  const block = css.slice(css.indexOf(START) + START.length, css.indexOf(END))
  const vars: Record<string, string> = {}
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars[m[1]] = m[2].trim()
  }
  return vars
}

/** Write the variables back into the auto block (between markers only; the handwritten zone is untouched) */
function writeTokens(vars: Record<string, string>): void {
  const css = readFileSync(TOKENS_FILE, 'utf8')
  const s = css.indexOf(START)
  const e = css.indexOf(END)
  if (s < 0 || e < 0 || e < s) throw new Error('tokens.css is missing its AUTO:TOKENS markers')
  const body = `\n:root {\n${Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')}\n}\n`
  writeFileSync(TOKENS_FILE, css.slice(0, s) + START + body + css.slice(e))
}

/** Validate token keys and values: reject invalid entries with a reason, never drop silently */
function validateTokens(vars: Record<string, unknown>): Record<string, string> {
  const clean: Record<string, string> = {}
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

/**
 * Dev-only token API: GET /__tokens reads; PUT /__tokens writes back to source (triggers HMR).
 * Exists only on the dev server, never in production builds.
 */
function tokensDevPlugin(): Plugin {
  return {
    name: 'tokens-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__tokens', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ vars: readTokens() }))
          return
        }
        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', () => {
            try {
              const { vars } = JSON.parse(body) as { vars: Record<string, unknown> }
              // Merge with on-disk values: the panel only sends the keys it knows,
              // a full replacement would clobber tokens added elsewhere
              writeTokens({ ...readTokens(), ...validateTokens(vars) })
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
    },
  }
}

/** mm -> px at the given DPI */
function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi)
}

/** Blank starter page at an explicit canvas size */
function blankSource(w: number, h: number, target: string): string {
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
import VueLogo from '@/components/VueLogo.vue'
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
 * Materialize a template at a (possibly different) canvas size:
 * rewrite the data-export dimensions and inject an inline width/height that
 * overrides the template's scoped CSS.
 */
function createSource(templateId: string, w: number, h: number, target: string): string {
  if (templateId === 'Blank') return blankSource(w, h, target)
  let src = readFileSync(resolve(TEMPLATES_DIR, `${templateId}.vue`), 'utf8')
  src = src.replace(/data-export-w="\d+"/, `data-export-w="${w}"`)
  src = src.replace(/data-export-h="\d+"/, `data-export-h="${h}"`)
  src = src.replace(/<([a-z][a-z0-9]*[^>]*?data-export[^>]*?)(\/?)>/, (_m, head: string, selfClose: string) => {
    return `<${head} style="width: ${w}px; height: ${h}px"${selfClose}>`
  })
  return `<!-- Created from template ${templateId} -> ${target} (${w}x${h}px) -->\n${src}`
}

/**
 * Dev-only page factory: POST /__pages writes a real .vue under src/pages/,
 * either Name.vue or Name/index.vue. Vite picks the file up on the next load
 * and the auto router serves it. Never part of production builds.
 */
function pagesDevPlugin(): Plugin {
  return {
    name: 'pages-dev-api',
    apply: 'serve',
    configureServer(server) {
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
            const { name, template, unit, dpi, w, h, asDir } = JSON.parse(body) as {
              name: unknown
              template: unknown
              unit: unknown
              dpi: unknown
              w: unknown
              h: unknown
              asDir: unknown
            }
            // PascalCase keeps generated files import-safe and traversal-proof
            if (!/^[A-Z][A-Za-z0-9]{0,39}$/.test(String(name))) {
              throw new Error('name must be PascalCase letters/digits, e.g. MyPoster')
            }
            if (template !== 'Blank' && !existsSync(resolve(TEMPLATES_DIR, `${template}.vue`))) {
              throw new Error(`unknown template: ${template}`)
            }
            if (unit !== 'px' && unit !== 'mm') throw new Error('unit must be px or mm')
            const dpiNum = Math.trunc(Number(dpi))
            if (unit === 'mm' && !(dpiNum >= 24 && dpiNum <= 1200)) {
              throw new Error('dpi must be 24-1200')
            }
            const toPx = (v: unknown) =>
              unit === 'mm' ? mmToPx(Number(v), dpiNum) : Math.round(Number(v))
            const pxW = toPx(w)
            const pxH = toPx(h)
            if (!(pxW >= 16 && pxW <= 20000) || !(pxH >= 16 && pxH <= 20000)) {
              throw new Error('canvas must resolve to 16-20000 px per side')
            }
            const file = asDir ? resolve(PAGES_DIR, String(name), 'index.vue') : resolve(PAGES_DIR, `${name}.vue`)
            // collide with either shape
            if (
              existsSync(file) ||
              existsSync(resolve(PAGES_DIR, `${name}.vue`)) ||
              existsSync(resolve(PAGES_DIR, String(name), 'index.vue'))
            ) {
              throw new Error(`src/pages already contains "${name}"`)
            }
            const target = `src/${relative(resolve(__dirname, 'src'), file)}`
            mkdirSync(dirname(file), { recursive: true })
            writeFileSync(file, createSource(String(template), pxW, pxH, target))
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

export default defineConfig({
  plugins: [vue(), tokensDevPlugin(), pagesDevPlugin()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
