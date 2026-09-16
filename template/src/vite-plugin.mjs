import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
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

// Element overrides saved from the Styles panel live between these markers
const OVERR_START = '/* AUTO:OVERRIDES:START */'
const OVERR_END = '/* AUTO:OVERRIDES:END */'

const PALETTE_VARS = `  --c-bg: #12151C;
  --c-surface: #1B2029;
  --c-accent: #42D392;
  --c-accent-soft: #8CE6BD;
  --c-brand-from: #41D1A7;
  --c-brand-to: #647EFF;
  --c-text: #F6F6F6;
  --c-text-muted: #A8A8A8;
  --fs-title: 86px;
  --fs-body: 38px;
  --radius-card: 16px;`

const DEFAULT_TOKENS = `/* Your design tokens. The panel edits only the block between the markers;
   anything outside is yours and is never rewritten. */

${START}
:root {
${PALETTE_VARS}
}
${END}
`

/** Page-local tokens appended to every generated page: a copy of the default
 *  palette scoped to the page root, so each material owns its own set. */
function withPageTokens(src) {
  return `${src}
<style scoped>
/* Page tokens: the panel edits only the block between the markers; they
   override the host-wide src/styles/tokens.css for this page. */
${START}
[data-export] {
${PALETTE_VARS}
}
${END}
</style>
`
}

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

/** ---------- element overrides (AUTO:OVERRIDES block) ---------- */

/** Selector whitelist: letters/digits and the combinators/pseudo syntax the
 *  client-side path builder produces; no < { } ; @ so nothing can break out
 *  of the style block */
function validateSelector(sel) {
  if (typeof sel !== 'string' || sel.length > 400) throw new Error('selector must be 1-400 chars')
  const s = sel.trim()
  if (!/^[A-Za-z0-9_.:,>()[\]="'*# -]+$/.test(s)) throw new Error('selector contains illegal characters')
  return s
}

/** A declaration value: no < ; { } newline (would break the CSS text) */
function validateDecl(prop, value) {
  if (!/^[-a-zA-Z0-9_]+$/.test(prop)) throw new Error(`invalid property name: ${prop}`)
  if (value === null) return null // removal marker
  if (typeof value !== 'string' || value.length === 0 || value.length > 100) {
    throw new Error(`${prop}: value must be 1-100 chars`)
  }
  if (/[<;{}\n]/.test(value)) throw new Error(`${prop}: value must not contain < ; { }`)
  return value.trim()
}

/** Parse the CSS between the OVERRIDES markers into selector -> {prop: value} */
function parseOverrides(css) {
  const rules = new Map()
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim()
    const props = {}
    for (const d of m[2].matchAll(/([-a-zA-Z0-9_]+)\s*:\s*([^;]+);/g)) props[d[1]] = d[2].trim()
    if (sel && Object.keys(props).length) rules.set(sel, props)
  }
  return rules
}

function serializeOverrides(rules) {
  let out = ''
  for (const [sel, props] of rules) {
    out += `${sel} {\n`
    for (const [p, v] of Object.entries(props)) out += `  ${p}: ${v};\n`
    out += '}\n'
  }
  return out
}

/** Merge incoming props for one selector into the page's OVERRIDES block,
 *  creating the <style> section on first use. null values remove declarations;
 *  selectors left empty drop out entirely. */
function upsertElementOverrides(file, selectorPath, props) {
  let src = readFileSync(file, 'utf8')
  const merged = src.includes(OVERR_START)
    ? parseOverrides(src.slice(src.indexOf(OVERR_START) + OVERR_START.length, src.indexOf(OVERR_END)))
    : new Map()

  const incoming = {}
  for (const [p, v] of Object.entries(props ?? {})) incoming[p] = validateDecl(p, v)

  const existing = merged.get(selectorPath) ?? {}
  for (const [p, v] of Object.entries(incoming)) {
    if (v === null) delete existing[p]
    else existing[p] = v
  }
  if (Object.keys(existing).length) merged.set(selectorPath, existing)
  else merged.delete(selectorPath)

  const body = serializeOverrides(merged)
  if (src.includes(OVERR_START)) {
    const s = src.indexOf(OVERR_START)
    const e = src.indexOf(OVERR_END)
    src = src.slice(0, s) + OVERR_START + '\n' + body + src.slice(e)
  } else {
    src += `\n<style scoped>\n/* Element overrides saved from the Styles panel; hand edits welcome */\n${OVERR_START}\n${body}${OVERR_END}\n</style>\n`
  }
  writeFileSync(file, src)
}

/** ---------- direct rule editing (rule rows write into the page source) ---------- */

/** Runtime selectors carry scoped attributes; the page source does not */
function stripScopedAttrs(sel) {
  return String(sel)
    .replace(/\[data-v-[a-f0-9]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Build a regex matching the rule in SOURCE text: whitespace-flexible exact
 *  full-selector match (comma lists included) followed by its body */
function selectorSourceRe(sel) {
  const parts = sel
    .split(',')
    .map((p) =>
      p
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\s+/g, '\\s+'),
    )
  return new RegExp(`(^|[}\\n])((?:[^{}]*?\\s)?${parts.join('\\s*,\\s*')}\\s*)(\\{[^}]*\\})`, 'g')
}

/** Edit prop inside every occurrence of the rule in the page source.
 *  value=null removes the declaration; absent props are inserted.
 *  Returns true when the rule was found and rewritten. */
function editRuleInSource(file, selector, prop, value) {
  let src = readFileSync(file, 'utf8')
  const re = selectorSourceRe(selector)
  let touched = false
  const next = src.replace(re, (_m, pre, head, body) => {
    touched = true
    const declRe = new RegExp(`(^|\\s)(${prop.replace(/[-]/g, '\\-')})\\s*:\\s*[^;]*;`, 'g')
    if (value === null) {
      return pre + head + body.replace(declRe, '$1')
    }
    if (declRe.test(body)) {
      // reset lastIndex (test with /g advances it)
      declRe.lastIndex = 0
      return pre + head + body.replace(declRe, `$1${prop}: ${value};`)
    }
    return pre + head + body.replace(/\}$/, `  ${prop}: ${value};\n}`)
  })
  if (!touched) return false
  writeFileSync(file, next)
  return true
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

  /** Resolve a page's file by route name (either shape); null when absent */
  function pageFile(name) {
    if (!/^[A-Z][A-Za-z0-9]{0,39}$/.test(String(name))) return null
    for (const f of [resolve(pagesDir, `${name}.vue`), resolve(pagesDir, String(name), 'index.vue')]) {
      if (existsSync(f)) return f
    }
    return null
  }

  /** Pick the tokens file for a request: the page's own AUTO block when it
   *  carries one, otherwise the host-wide tokens.css. Returns scope info. */
  function resolveTokensTarget(page) {
    const file = page ? pageFile(page) : null
    if (file) {
      const css = readFileSync(file, 'utf8')
      if (css.includes(START) && css.includes(END)) return { file, scope: 'page', page }
    }
    return { file: tokensFile, scope: 'global', page: null }
  }

  return {
    name: 'vue-design-lab',
    apply: 'serve',
    config() {
      // this package is consumed as source via link:/workspace installs -
      // never let Vite pre-bundle it (esbuild cannot handle .vue)
      return {
        optimizeDeps: { exclude: ['vue-design-lab'] },
        // link: installs put this package's real files (and its node_modules)
        // outside the host root; fs.strict would 403 export-time fetches of
        // e.g. bundled fonts via the symlink. Dev-only design tool: allow.
        server: { fs: { strict: false } },
      }
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
      // ---------- token API (per-page AUTO block when present, else global) ----------
      server.middlewares.use('/__tokens', (req, res) => {
        const page = new URL(req.url ?? '/', 'http://lab').searchParams.get('page')
        if (req.method === 'GET') {
          const target = resolveTokensTarget(page)
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ vars: readTokens(target.file), scope: target.scope, page: target.page }))
          return
        }
        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', () => {
            try {
              const { vars } = JSON.parse(body)
              const target = resolveTokensTarget(page)
              // Merge with on-disk values: the panel only sends the keys it knows,
              // a full replacement would clobber tokens added elsewhere
              writeTokens(target.file, { ...readTokens(target.file), ...validateTokens(vars) })
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
            const target = relative(root, file)
            mkdirSync(dirname(file), { recursive: true })
            writeFileSync(file, withPageTokens(createSource(templatesDir, String(template), pxW, pxH, target)))
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ route: `/${name}` }))
          } catch (err) {
            console.warn('[pages] POST rejected:', String(err))
            res.statusCode = 400
            res.end(err instanceof Error ? err.message : String(err))
          }
        })
      })

      // ---------- element overrides (Element tab write-back) ----------
      server.middlewares.use('/__element-styles', (req, res) => {
        if (req.method !== 'PUT') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          try {
            const { page, selectorPath, props } = JSON.parse(body)
            const file = pageFile(page)
            if (!file) throw new Error(`unknown page: ${page}`)
            upsertElementOverrides(file, validateSelector(selectorPath), props)
            res.statusCode = 200
            res.end('ok')
          } catch (err) {
            console.warn('[element-styles] PUT rejected:', String(err))
            res.statusCode = 400
            res.end(err instanceof Error ? err.message : String(err))
          }
        })
      })

      // ---------- direct rule editing (writes into the original rule) ----------
      server.middlewares.use('/__element-rule', (req, res) => {
        if (req.method !== 'PUT') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          try {
            const { page, selector, prop, value } = JSON.parse(body)
            const file = pageFile(page)
            if (!file) throw new Error(`unknown page: ${page}`)
            const sel = stripScopedAttrs(validateSelector(selector))
            const val = validateDecl(prop, value)
            // edit the original rule in place; when the selector does not
            // exist in the page source, fall back to the OVERRIDES block
            if (editRuleInSource(file, sel, prop, val)) {
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ mode: 'source' }))
            } else {
              upsertElementOverrides(file, sel, { [prop]: val })
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ mode: 'override' }))
            }
          } catch (err) {
            console.warn('[element-rule] PUT rejected:', String(err))
            res.statusCode = 400
            res.end(err instanceof Error ? err.message : String(err))
          }
        })
      })

      // ---------- vector PDF export (puppeteer-core + headless Chrome) ----------
      // GET /__vector-pdf?page=Name — launches the system Chrome headless,
      // navigates to the material page, calls page.pdf() with the exact
      // material dimensions. Output is true vector: selectable text,
      // vector shapes, embedded images — no dialog, one click.
      server.middlewares.use('/__vector-pdf', async (req, res) => {
        const u = new URL(req.url ?? '/', 'http://lab')
        const pageName = u.searchParams.get('page')
        if (req.method !== 'GET' || !pageName) {
          res.statusCode = 400
          res.end('usage: GET /__vector-pdf?page=PageName')
          return
        }
        const file = pageFile(pageName)
        if (!file) {
          res.statusCode = 400
          res.end(`unknown page: ${pageName}`)
          return
        }
        // find a Chrome/Chromium executable
        const chromePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
          '/snap/bin/chromium',
        ]
        const chromePath = chromePaths.find((p) => existsSync(p))
        if (!chromePath) {
          res.statusCode = 503
          res.end('No Chrome/Chromium found on this machine')
          return
        }
        // read the material's declared canvas size from the source file
        const src = readFileSync(file, 'utf8')
        const wm = /data-export-w="(\d+)"/.exec(src)
        const hm = /data-export-h="(\d+)"/.exec(src)
        if (!wm || !hm) {
          res.statusCode = 400
          res.end(`page ${pageName} has no data-export dimensions`)
          return
        }
        const wPx = Number(wm[1])
        const hPx = Number(hm[1])
        const wIn = (wPx / 96).toFixed(4)
        const hIn = (hPx / 96).toFixed(4)
        const port = server.config.server.port ?? 5173
        // no ?print=1 needed: page.pdf() uses print media automatically,
        // and the @media print rules in base.css hide the workbench UI
        const url = `http://localhost:${port}/${pageName}`

        console.log(`[vector-pdf] ${pageName}: ${wPx}x${hPx}px (${wIn}x${hIn}in)`)
        try {
          const { default: puppeteer } = await import('puppeteer-core')
          const browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: true,
            args: ['--no-sandbox', '--disable-gpu', `--font-render-hinting=none`],
          })
          const page = await browser.newPage()
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 20_000 })
          // give fonts + images a moment to settle
          await page.evaluate(() => document.fonts.ready)
          await new Promise((r) => setTimeout(r, 500))
          const pdf = await page.pdf({
            width: `${wIn}in`,
            height: `${hIn}in`,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            preferCSSPageSize: false,
            displayHeaderFooter: false,  // kill the URL/date header
          })
          await browser.close()
          res.setHeader('content-type', 'application/pdf')
          res.setHeader('content-disposition', `attachment; filename="${pageName}.pdf"`)
          res.end(pdf)
          console.log(`[vector-pdf] ${pageName}.pdf generated (${(pdf.length / 1048576).toFixed(2)} MB)`)
        } catch (err) {
          console.warn('[vector-pdf] failed:', String(err))
          res.statusCode = 500
          res.end(`Vector PDF failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      })
    },
  }
}
