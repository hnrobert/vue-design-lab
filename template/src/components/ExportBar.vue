<template>
  <div class="export-bar">
    <span class="meta">{{ metaLabel }}</span>
    <button :disabled="!hasTarget" @click="exportPNG(2)">Export PNG (2x)</button>
    <button :disabled="!hasTarget" @click="exportPDF(2)">Export PDF</button>
    <button :disabled="!hasTarget" @click="printPage">Print / Save as PDF</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { findExportRoot, exportPNG, exportPDF, printPage } from '@/export/useExport'

const route = useRoute()

// Depends on route.fullPath: re-probe the export root when switching material pages
const exportMeta = computed(() => {
  void route.fullPath
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
