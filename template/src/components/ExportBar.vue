<template>
  <div ref="barEl" class="export-bar" :class="{ 'menu-open': open }">
    <span class="meta">{{ metaLabel }}</span>
    <span v-if="error" class="error">{{ error }}</span>
    <button
      ref="triggerEl"
      class="export"
      :disabled="!hasTarget || busy"
      :aria-expanded="open"
      aria-haspopup="dialog"
      title="Export as PNG or PDF"
      @click="open = !open"
    >
      {{ busy ? 'Exporting...' : 'Export' }}
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="6 15 12 9 18 15" />
      </svg>
    </button>

    <!-- Both formats side by side, every option listed at once -->
    <div v-if="open" class="export-menu" role="dialog" aria-label="Export">
      <div class="col-head">
        <b>PNG</b>
        <span>Raster image</span>
      </div>
      <div class="col-head">
        <b>PDF</b>
        <span>Document</span>
      </div>

      <div class="opts" role="group" aria-label="PNG scale">
        <p class="group">Scale</p>
        <button v-for="s in PNG_SCALES" :key="s" class="opt" :class="{ rec: s === RECOMMENDED }" @click="run('png', s)">
          <span>{{ s }}x</span>
          <span class="detail">{{ pxSize(s) }}</span>
        </button>
      </div>
      <div class="opts" role="group" aria-label="PDF options">
        <p class="group">Raster image</p>
        <button v-for="s in PDF_SCALES" :key="s" class="opt" :class="{ rec: s === RECOMMENDED }" @click="run('pdf', s)">
          <span>{{ s }}x</span>
          <span class="detail">{{ Math.round(s * 96) }} DPI</span>
        </button>
        <p class="group">Vector</p>
        <button class="opt" title="Headless Chrome print engine: vector text, vector shapes, one click, no dialog" @click="vectorPDF">
          <span>Vector PDF</span>
          <span class="detail">Selectable text</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { findExportRoot, exportPNG, exportPDF } from '../utils/export'

/** One-click vector PDF via the dev middleware's headless Chrome */
function vectorPDF() {
  const name = String(route.name ?? '')
  if (!name) return
  open.value = false
  window.location.href = `/__vector-pdf?page=${encodeURIComponent(name)}`
}

const route = useRoute()

// findExportRoot reads the DOM, but right after a route change the page
// component may not be mounted yet - the label would cache a stale
// "data-export missing". A post-render tick re-runs the probe once Vue has
// patched the RouterView, on first load and on every navigation.
const domTick = ref(0)

onMounted(async () => {
  await nextTick()
  domTick.value++
})

watch(
  () => route.fullPath,
  async () => {
    open.value = false
    await nextTick()
    domTick.value++
  },
)

const exportMeta = computed(() => {
  void route.fullPath
  void domTick.value
  return findExportRoot()
})

const hasTarget = computed(() => exportMeta.value !== null)

const metaLabel = computed(() => {
  const name = String(route.name ?? '')
  const meta = exportMeta.value
  return meta ? `${name} · ${meta.w}x${meta.h}px` : `${name} · data-export missing`
})

// ---------- the export menu ----------
const barEl = ref<HTMLElement>()
const triggerEl = ref<HTMLButtonElement>()
const open = ref(false)
const busy = ref(false)
const error = ref('')

const PNG_SCALES = [0.5, 1, 2, 4]
const PDF_SCALES = [1, 2, 4]
/** ~192 DPI: sharp in print while the file (and the canvas) stay sane */
const RECOMMENDED = 2

/** Pixel size of the PNG a scale produces. The render canvas truncates
 *  fractional sizes (1123px at 0.5x is 561, not 562), so the label does too. */
function pxSize(scale: number): string {
  const meta = exportMeta.value
  return meta ? `${Math.floor(meta.w * scale)}x${Math.floor(meta.h * scale)} px` : ''
}

async function run(kind: 'png' | 'pdf', scale: number) {
  open.value = false
  busy.value = true
  error.value = ''
  try {
    await (kind === 'png' ? exportPNG(scale) : exportPDF(scale))
  } catch (e) {
    error.value = `Export failed: ${e instanceof Error ? e.message : String(e)}`
  } finally {
    busy.value = false
  }
}

/** A transient popover: anything pressed outside of the bar closes it */
function onOutside(e: PointerEvent) {
  if (!barEl.value?.contains(e.target as Node)) open.value = false
}

let returnFocus = false
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !open.value) return
  returnFocus = true
  open.value = false
}

watch(open, (on) => {
  if (on) {
    document.addEventListener('pointerdown', onOutside, true)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('pointerdown', onOutside, true)
    document.removeEventListener('keydown', onKeydown)
    if (returnFocus) {
      triggerEl.value?.focus()
      returnFocus = false
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside, true)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.export-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 18px;
  background: var(--c-bg);
  border-top: 1px solid #262b38;
  z-index: 10;
}
/* above the styles panel (40) and the zoom pill (20) while the menu is up */
.export-bar.menu-open {
  z-index: 45;
}
.meta {
  color: var(--c-text-muted);
  font-size: 13px;
  margin-right: auto;
}
.error {
  color: #f87171;
  font-size: 12px;
  max-width: 50vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: var(--c-accent);
  color: var(--c-bg);
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.export:not(:disabled):hover {
  background: var(--c-accent-soft);
}
.export:not(:disabled):active {
  transform: translateY(-1px);
}
.export:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
/* row 1: the two format titles, row 2: their options, every one listed */
.export-menu {
  position: absolute;
  right: 18px;
  bottom: calc(100% + 8px);
  width: 400px;
  max-width: calc(100vw - 24px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  background: var(--c-bg);
  border: 1px solid #262b38;
  border-radius: var(--radius-card);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  color: var(--c-text);
  font-size: 12px;
}
/* the divider between the two formats, drawn by the menu itself so nothing
   can paint over it */
.export-menu::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: #262b38;
  z-index: 1;
}
.col-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #262b38;
  color: var(--c-text-muted);
}
.col-head b {
  font-size: 13px;
  letter-spacing: 0.12em;
  color: #fff;
}
.col-head span {
  font-size: 11px;
}
.opts {
  padding: 2px 8px 10px;
}
.group {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 10px;
  color: var(--c-text-muted);
  padding: 8px 8px 2px;
}
.opt {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--c-text);
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.opt:hover,
.opt:focus-visible {
  background: var(--c-surface);
}
.opt .detail {
  color: var(--c-text-muted);
  font-size: 11px;
  white-space: nowrap;
}
.opt.rec span:first-child {
  color: var(--c-accent);
  font-weight: 600;
}
</style>
