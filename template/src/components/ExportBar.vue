<template>
  <div class="export-bar">
    <span class="meta">{{ metaLabel }}</span>
    <button :disabled="!hasTarget" @click="exportPNG(2)">Export PNG (2x)</button>
    <button :disabled="!hasTarget" @click="exportPDF(2)">Export PDF (raster)</button>
    <button :disabled="!hasTarget" @click="vectorPDF" title="Headless Chrome print engine: vector text, vector shapes, one click, no dialog">Export PDF (vector)</button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { findExportRoot, exportPNG, exportPDF, printPage } from '../utils/export'

/** One-click vector PDF via the dev middleware's headless Chrome */
function vectorPDF() {
  const name = String(route.name ?? '')
  if (!name) return
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
.meta {
  color: var(--c-text-muted);
  font-size: 13px;
  margin-right: auto;
}
button {
  border: none;
  background: var(--c-accent);
  color: var(--c-bg);
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
