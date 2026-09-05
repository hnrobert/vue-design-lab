#!/usr/bin/env node
/**
 * create-vue-design-lab — scaffold a poster workbench for designers, in one command.
 *
 *   pnpm create vue-design-lab my-lab
 *   npm create vue-design-lab@latest my-lab
 *
 * Zero dependencies: copy the template, rewrite the package name, drop a .gitignore.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const GREEN = '[38;2;66;211;146m' // Vue green #42d392
const BOLD = '[1m'
const DIM = '[2m'
const RED = '[31m'
const RESET = '[0m'

const TEMPLATE_DIR = fileURLToPath(new URL('./template', import.meta.url))

function fail(msg) {
  console.error(`${RED}x ${msg}${RESET}`)
  process.exit(1)
}

// ---------- args ----------
const argv = process.argv.slice(2)
const force = argv.includes('--force')
const wantsHelp = argv.includes('-h') || argv.includes('--help')
const positional = argv.filter((a) => !a.startsWith('-'))

if (wantsHelp) {
  console.log(`Usage: npm create vue-design-lab [target-dir] [--force]

  target-dir  where to scaffold, default vue-design-lab; pass . for current dir
  --force     wipe a non-empty target dir and rebuild (destructive, careful)
`)
  process.exit(0)
}

const rawName = positional[0] ?? 'vue-design-lab'
const targetDir = rawName === '.' ? process.cwd() : resolve(process.cwd(), rawName)

// npm names only take lowercase letters/digits/dashes; dirs are unrestricted,
// invalid names fall back to the default package name
const dirName = basename(rawName === '.' ? process.cwd() : targetDir)
const pkgName = /^[a-z0-9-][a-z0-9._-]*$/.test(dirName.toLowerCase())
  ? dirName.toLowerCase()
  : 'vue-design-lab'

// ---------- target dir check ----------
const occupied = existsSync(targetDir) && readdirSync(targetDir).length > 0
if (occupied && !force) {
  fail(`Target directory exists and is not empty: ${targetDir}\n  Pick another name, or pass --force to wipe and rebuild.`)
}
if (occupied && force) {
  rmSync(targetDir, { recursive: true, force: true })
}
mkdirSync(targetDir, { recursive: true })

// ---------- copy the template (skip local artifacts) ----------
const skip = (src) => !/[\\/](node_modules|dist|tsconfig\.tsbuildinfo)$/.test(src)
for (const entry of readdirSync(TEMPLATE_DIR)) {
  cpSync(join(TEMPLATE_DIR, entry), join(targetDir, entry), {
    recursive: true,
    filter: skip,
  })
}

// ---------- rewrite the package name to the target dir name ----------
const pkgPath = join(targetDir, 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.name = pkgName
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

// ---------- .gitignore for the scaffolded copy ----------
writeFileSync(
  join(targetDir, '.gitignore'),
  `node_modules
dist
*.local
.DS_Store
`,
)

// ---------- next steps ----------
console.log(`
${BOLD}${GREEN}Vue Design Lab${RESET}
  Scaffolded at ${DIM}${targetDir}${RESET}

  Next steps:

    cd ${rawName === '.' ? '.' : rawName}
    pnpm install        ${DIM}# or npm install${RESET}
    pnpm dev            ${DIM}# open http://localhost:5173${RESET}

  Conventions at a glance:

    - Drop a .vue file into src/pages/ and it becomes a material page
    - Declare data-export-w / data-export-h (px) on the root element to enable one-click PNG / PDF export
    - The top-right panel edits design tokens and writes them back to src/styles/tokens.css
`)
