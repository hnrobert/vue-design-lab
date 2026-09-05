import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const TOKENS_FILE = resolve(__dirname, 'src/styles/tokens.css')
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

export default defineConfig({
  plugins: [vue(), tokensDevPlugin()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
