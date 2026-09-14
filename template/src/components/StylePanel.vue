<template>
  <button v-if="!open" class="fab" title="Styles: tokens & elements" @click="open = true">
    <VueLogo :size="16" inner="var(--c-surface)" />
  </button>

  <div v-else class="style-panel">
    <div class="head">
      <div class="tabs">
        <button :class="{ on: tab === 'tokens' }" @click="tab = 'tokens'">Tokens</button>
        <button :class="{ on: tab === 'element' }" @click="tab = 'element'">Element</button>
      </div>
      <button class="close" title="Close" @click="open = false">×</button>
    </div>

    <!-- ================= Tokens tab ================= -->
    <div v-if="tab === 'tokens'" class="body">
      <p class="tip">{{ scopeTip }}</p>
      <div class="rows">
        <label v-for="(v, k) in vars" :key="k" class="row">
          <code>{{ k }}</code>
          <input
            v-if="isColor(v)"
            type="color"
            :value="normalizeHex(v)"
            @input="setToken(k, ($event.target as HTMLInputElement).value)"
          />
          <template v-else-if="isPx(v)">
            <input
              type="range"
              min="4"
              max="160"
              :value="pxNum(v)"
              @input="setToken(k, `${($event.target as HTMLInputElement).value}px`)"
            />
            <span class="val">{{ v }}</span>
          </template>
          <input v-else class="text" :value="v" @change="setToken(k, ($event.target as HTMLInputElement).value)" />
        </label>
      </div>
      <div v-if="savedAt" class="saved">Written to source {{ savedAt }}</div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>

    <!-- ================= Element tab ================= -->
    <div v-else class="body">
      <div v-if="!selected" class="empty">
        <button class="pick" :class="{ on: inspect }" @click="emit('update:inspect', !inspect)">
          {{ inspect ? 'Inspect mode on - click an element in the material' : 'Turn on inspect mode' }}
        </button>
        <span class="hint">or use the arrow button in the top bar</span>
      </div>

      <template v-else>
        <div class="elt-head">
          <b class="tag">
            {{ selected.tagName.toLowerCase() }}<span v-for="c in classes" :key="c" class="cls">.{{ c }}</span>
          </b>
          <button class="x" title="Deselect (Esc)" @click="clear">×</button>
        </div>

        <section v-if="inlineProps.length">
          <h4>element.style</h4>
          <div v-for="p in inlineProps" :key="p.prop" class="prop">
            <code>{{ p.prop }}</code>
            <input :value="p.value" spellcheck="false" @change="setInline(p.prop, $event)" />
            <button class="rm" title="Remove" @click="removeInline(p.prop)">×</button>
          </div>
        </section>

        <section v-for="r in rules" :key="r.id">
          <h4>{{ r.selector }}</h4>
          <div v-for="p in r.props" :key="p.prop" class="prop">
            <code>{{ p.prop }}</code>
            <input :value="p.value" spellcheck="false" @change="setInline(p.prop, $event)" />
          </div>
        </section>

        <section class="add">
          <input v-model="newProp" placeholder="property, e.g. font-size" spellcheck="false" @keydown.enter="addProp" />
          <input v-model="newVal" placeholder="value, e.g. 24px" spellcheck="false" @keydown.enter="addProp" />
        </section>

        <footer class="elt-foot">
          <span class="hint">
            Edits apply live and are written back into the page's AUTO:OVERRIDES block
            <template v-if="eltSavedAt"> - saved {{ eltSavedAt }}</template>
          </span>
          <span v-if="eltError" class="elt-error">{{ eltError }}</span>
          <button class="copy" @click="copyCss">Copy CSS</button>
        </footer>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import VueLogo from './VueLogo.vue'

/**
 * The unified style editor, two tabs:
 *
 * - Tokens: the design-system layer. Reads/writes the AUTO:TOKENS block of the
 *   CURRENT page's file when it carries one (per-page palette), falling back
 *   to the host-wide src/styles/tokens.css. Edits persist to source.
 * - Element: a DevTools-like inspector. While inspect mode is on, clicking an
 *   element inside [data-export] selects it; the tab lists every CSS rule
 *   that applies (from the live stylesheets) plus its inline style, all
 *   editable - edits land as inline overrides: live preview, export-safe,
 *   not persisted to source (that is what Tokens are for).
 */
const open = defineModel<boolean>('open', { default: false })
const inspect = defineModel<boolean>('inspect', { default: false })
const emit = defineEmits<{ 'update:inspect': [boolean] }>()

const route = useRoute()
const tab = ref<'tokens' | 'element'>('tokens')

// selecting an element (or enabling inspect) focuses the Element tab
watch(inspect, (on) => {
  if (on) tab.value = 'element'
  else clear()
})

// ================= tokens =================
const vars = ref<Record<string, string>>({})
const scope = ref<'page' | 'global'>('global')
const savedAt = ref('')
const error = ref('')

const scopeTip = computed(() =>
  scope.value === 'page'
    ? `Page tokens (${String(route.name)}) - written back into the page file`
    : 'Global tokens - written back to src/styles/tokens.css',
)

const isColor = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v)
const isPx = (v: string) => /^\d+(\.\d+)?px$/.test(v)
const pxNum = (v: string) => Number(v.replace('px', ''))
const normalizeHex = (v: string) => (isColor(v) ? v : '#000000')

async function loadTokens() {
  error.value = ''
  try {
    const res = await fetch(`/__tokens?page=${encodeURIComponent(String(route.name ?? ''))}`)
    const data = (await res.json()) as { vars: Record<string, string>; scope: 'page' | 'global' }
    vars.value = data.vars
    scope.value = data.scope
    savedAt.value = ''
  } catch {
    error.value = 'Load failed: dev server unreachable'
  }
}

onMounted(loadTokens)
watch(
  () => route.fullPath,
  () => {
    if (open.value && tab.value === 'tokens') loadTokens()
  },
)
watch(open, (on) => {
  if (on && tab.value === 'tokens') loadTokens()
})

let timer: number | undefined

function setToken(name: string, value: string) {
  vars.value = { ...vars.value, [name]: value }
  error.value = ''
  // 1) Preview instantly: touch only the runtime variable
  document.documentElement.style.setProperty(name, value)
  // 2) Debounced write-back to source -> Vite HMR (and persistence into the git-visible file)
  window.clearTimeout(timer)
  timer = window.setTimeout(async () => {
    try {
      const res = await fetch(`/__tokens?page=${encodeURIComponent(String(route.name ?? ''))}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ vars: vars.value }),
      })
      if (res.ok) {
        savedAt.value = new Date().toLocaleTimeString()
      } else {
        error.value = `Write failed: ${await res.text()}`
      }
    } catch {
      error.value = 'Write failed: dev server unreachable'
    }
  }, 350)
}

// ================= element inspector =================
const selected = ref<HTMLElement | null>(null)
const newProp = ref('')
const newVal = ref('')

// ---------- element write-back ----------
// Edits preview as inline overrides AND persist into the page's
// AUTO:OVERRIDES block, keyed by the element's full CSS path
const overridePath = ref('')
const pendingOverrides = ref<Record<string, string | null>>({})
const eltSavedAt = ref('')
const eltError = ref('')

/** Unique readable CSS path from the material root down to the element.
 *  Classes when present, nth-of-type disambiguation when not - specificity
 *  ends up at or above the page's own rules, and it survives reloads. */
function cssPath(el: HTMLElement): string {
  const root = el.closest('[data-export]')
  const parts: string[] = []
  let cur: HTMLElement | null = el
  while (cur && cur !== root) {
    let sel = cur.tagName.toLowerCase()
    const cls = Array.from(cur.classList).filter((c) => !c.startsWith('data-v-') && !c.startsWith('px-'))
    if (cls.length) sel += '.' + cls.join('.')
    else if (cur.parentElement) {
      const sameType = Array.from(cur.parentElement.children).filter((c) => c.tagName === cur!.tagName)
      if (sameType.length > 1) sel += `:nth-of-type(${sameType.indexOf(cur) + 1})`
    }
    parts.unshift(sel)
    cur = cur.parentElement
  }
  return parts.join(' ')
}

let eltTimer: number | undefined

function queueOverride(prop: string, value: string | null) {
  if (!overridePath.value) return
  pendingOverrides.value[prop] = value
  eltSavedAt.value = ''
  eltError.value = ''
  window.clearTimeout(eltTimer)
  eltTimer = window.setTimeout(async () => {
    const props = { ...pendingOverrides.value }
    pendingOverrides.value = {}
    try {
      const res = await fetch('/__element-styles', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          page: String(route.name ?? ''),
          selectorPath: overridePath.value,
          props,
        }),
      })
      if (res.ok) {
        eltSavedAt.value = new Date().toLocaleTimeString()
      } else {
        eltError.value = `Write failed: ${await res.text()}`
      }
    } catch {
      eltError.value = 'Write failed: dev server unreachable'
    }
  }, 600)
}

interface Prop {
  prop: string
  value: string
}
interface RuleGroup {
  id: string
  selector: string
  props: Prop[]
}
const rules = ref<RuleGroup[]>([])
const inlineProps = ref<Prop[]>([])

const classes = computed(() =>
  selected.value ? Array.from(selected.value.classList).filter((c) => !c.startsWith('data-v-')) : [],
)

function refreshInline() {
  const el = selected.value
  if (!el) {
    inlineProps.value = []
    return
  }
  const st = el.style
  const props: Prop[] = []
  for (let i = 0; i < st.length; i++) {
    const prop = st.item(i)
    props.push({ prop, value: st.getPropertyValue(prop) })
  }
  inlineProps.value = props
}

/** Enumerate the stylesheets' rules that match the element, DevTools-style.
 *  Workbench artifacts are filtered out: the inspector's own hover/selection
 *  outline rules and the global `*` reset would otherwise appear under every
 *  element and drown the material's own styles. */
const NOISE_SELECTOR = [/^\[data-inspect-(?:hover|sel)\]$/, /^\*$/]

function isNoiseSelector(sel: string): boolean {
  return NOISE_SELECTOR.some((re) => re.test(sel.trim()))
}

function collectRules(el: HTMLElement) {
  const out: RuleGroup[] = []
  const walk = (list: CSSRuleList) => {
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
        walk(rule.cssRules)
        continue
      }
      if (!(rule instanceof CSSStyleRule)) continue
      const matchedParts: string[] = []
      for (const sel of rule.selectorText.split(',')) {
        try {
          if (el.matches(sel.trim()) && !isNoiseSelector(sel)) matchedParts.push(sel.trim())
        } catch {
          // pseudo-element / invalid selectors do not match elements
        }
      }
      if (!matchedParts.length) continue
      const props: Prop[] = []
      for (let i = 0; i < rule.style.length; i++) {
        const prop = rule.style.item(i)
        props.push({ prop, value: rule.style.getPropertyValue(prop) })
      }
      if (props.length) {
        out.push({ id: `${out.length}::${matchedParts.join(', ')}`, selector: matchedParts.join(', '), props })
      }
    }
  }
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList
    try {
      list = sheet.cssRules
    } catch {
      continue // cross-origin stylesheet, not readable via CSSOM
    }
    walk(list)
  }
  return out
}

function select(el: HTMLElement) {
  selected.value?.removeAttribute('data-inspect-sel')
  selected.value = el
  el.setAttribute('data-inspect-sel', '')
  rules.value = collectRules(el)
  refreshInline()
  overridePath.value = cssPath(el)
  pendingOverrides.value = {}
  eltSavedAt.value = ''
  eltError.value = ''
  tab.value = 'element'
  open.value = true
}

function clear() {
  selected.value?.removeAttribute('data-inspect-sel')
  selected.value = null
  rules.value = []
  inlineProps.value = []
}

function setInline(prop: string, ev: Event) {
  const el = selected.value
  if (!el) return
  const value = (ev.target as HTMLInputElement).value.trim()
  if (!value) el.style.removeProperty(prop)
  else el.style.setProperty(prop, value)
  refreshInline()
  queueOverride(prop, value || null)
}

function removeInline(prop: string) {
  selected.value?.style.removeProperty(prop)
  refreshInline()
  queueOverride(prop, null)
}

function addProp() {
  const prop = newProp.value.trim()
  const value = newVal.value.trim()
  if (!prop || !value || !selected.value) return
  selected.value.style.setProperty(prop, value)
  newProp.value = ''
  newVal.value = ''
  refreshInline()
  queueOverride(prop, value)
}

async function copyCss() {
  const css = selected.value?.style.cssText ?? ''
  try {
    await navigator.clipboard.writeText(css)
  } catch {
    /* clipboard unavailable - no-op */
  }
}

// ---------- DOM listeners while inspect mode is on ----------
function onClickCapture(e: MouseEvent) {
  const target = e.target as Element
  const el = target.closest<HTMLElement>('[data-export] *') ?? target.closest<HTMLElement>('[data-export]')
  if (el) {
    e.stopPropagation()
    e.preventDefault()
    select(el)
  }
}

function onMouseOver(e: MouseEvent) {
  const el = (e.target as Element).closest<HTMLElement>('[data-export] *, [data-export]')
  el?.setAttribute('data-inspect-hover', '')
}

function onMouseOut(e: MouseEvent) {
  const el = e.target as Element
  if (el.hasAttribute?.('data-inspect-hover')) el.removeAttribute('data-inspect-hover')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') clear()
}

watch(
  inspect,
  (on) => {
    if (on) {
      document.addEventListener('click', onClickCapture, true)
      document.addEventListener('mouseover', onMouseOver)
      document.addEventListener('mouseout', onMouseOut)
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('click', onClickCapture, true)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('keydown', onKeydown)
      document.querySelectorAll('[data-inspect-hover]').forEach((el) => el.removeAttribute('data-inspect-hover'))
      clear()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  inspect.value = false
})
</script>

<!-- unscoped: selection marks apply to arbitrary material elements -->
<style>
[data-inspect-hover] {
  outline: 1.5px dashed #42d392;
  outline-offset: -1px;
}
[data-inspect-sel] {
  outline: 1.5px solid #42d392;
  outline-offset: -1px;
}
</style>

<style scoped>
.fab {
  cursor: pointer;
  display: grid;
  place-items: center;
  background: var(--c-surface);
  border: 1px solid #262b38;
  border-radius: 8px;
  padding: 6px 10px;
}
.style-panel {
  position: fixed;
  right: 14px;
  bottom: 66px;
  width: 360px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
  border: 1px solid #262b38;
  border-radius: var(--radius-card);
  z-index: 40;
  color: var(--c-text);
  font-size: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}
.head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #262b38;
}
.tabs {
  display: flex;
  gap: 4px;
}
.tabs button {
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--c-text-muted);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 10px;
}
.tabs button.on {
  color: #fff;
  background: var(--c-surface);
  border-color: #262b38;
}
.close {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--c-text-muted);
  font-size: 16px;
  cursor: pointer;
}
.close:hover {
  color: #fff;
}
.body {
  overflow: auto;
  padding: 10px 12px 12px;
}
.tip {
  color: var(--c-text-muted);
  font-size: 11px;
  margin-bottom: 10px;
}

/* tokens tab */
.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: grid;
  grid-template-columns: 130px 1fr auto;
  align-items: center;
  gap: 8px;
}
.row code {
  color: var(--c-accent-soft);
  font-size: 12px;
}
.row input[type='color'] {
  width: 100%;
  height: 26px;
  border: none;
  background: none;
  cursor: pointer;
}
.row input[type='range'] {
  width: 100%;
}
.val {
  color: var(--c-text-muted);
  font-size: 11px;
  min-width: 48px;
  text-align: right;
}
.text {
  width: 100%;
  background: var(--c-surface);
  color: var(--c-text);
  border: 1px solid #262b38;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 12px;
}
.saved {
  margin-top: 10px;
  color: var(--c-accent);
  font-size: 12px;
}
.error {
  margin-top: 10px;
  color: #f87171;
  font-size: 12px;
}

/* element tab */
.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.pick {
  background: var(--c-surface);
  border: 1px solid #262b38;
  border-radius: 8px;
  color: var(--c-text);
  cursor: pointer;
  font-size: 12px;
  padding: 8px 12px;
}
.pick.on {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: var(--c-bg);
  font-weight: 600;
}
.elt-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.tag {
  color: #fff;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cls {
  color: var(--c-accent);
}
.x {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--c-text-muted);
  font-size: 16px;
  cursor: pointer;
}
.x:hover {
  color: #fff;
}
section {
  margin-top: 10px;
}
h4 {
  color: var(--c-accent-soft);
  font-size: 11px;
  font-weight: 500;
  font-family: ui-monospace, monospace;
  margin-bottom: 6px;
  word-break: break-all;
}
.prop {
  display: grid;
  grid-template-columns: 110px 1fr auto;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
}
.prop code {
  color: var(--c-text-muted);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prop input {
  background: var(--c-surface);
  border: 1px solid #262b38;
  border-radius: 4px;
  color: var(--c-text);
  font-size: 11.5px;
  font-family: ui-monospace, monospace;
  padding: 3px 6px;
  width: 100%;
  min-width: 0;
}
.prop input:focus {
  outline: none;
  border-color: var(--c-accent);
}
.rm {
  background: none;
  border: none;
  color: var(--c-text-muted);
  cursor: pointer;
  font-size: 13px;
  padding: 0 2px;
}
.rm:hover {
  color: #f87171;
}
.add {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.add input {
  background: var(--c-surface);
  border: 1px dashed #3a4152;
  border-radius: 4px;
  color: var(--c-text);
  font-size: 11.5px;
  padding: 4px 6px;
}
.add input:focus {
  outline: none;
  border-color: var(--c-accent);
}
.elt-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.elt-error {
  color: #f87171;
  font-size: 11px;
}
.hint {
  color: #6c7484;
  font-size: 10.5px;
  line-height: 1.4;
}
.copy {
  margin-left: auto;
  background: none;
  border: 1px solid #262b38;
  border-radius: 6px;
  color: var(--c-text-muted);
  cursor: pointer;
  font-size: 11px;
  padding: 4px 10px;
  white-space: nowrap;
}
.copy:hover {
  color: #fff;
  border-color: var(--c-accent);
}
</style>
