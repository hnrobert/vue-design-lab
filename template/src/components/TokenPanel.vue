<template>
  <div v-if="!open" class="fab" title="Design tokens" @click="open = true">
    <VueLogo :size="16" inner="var(--c-surface)" />
  </div>
  <div v-else class="panel">
    <div class="head">
      <b>Design Tokens</b>
      <span class="tip">Edits are written back to src/styles/tokens.css (source-level)</span>
      <button class="close" @click="open = false">×</button>
    </div>
    <div class="rows">
      <label v-for="(v, k) in vars" :key="k" class="row">
        <code>{{ k }}</code>
        <input
          v-if="isColor(v)"
          type="color"
          :value="normalizeHex(v)"
          @input="set(k, ($event.target as HTMLInputElement).value)"
        />
        <template v-else-if="isPx(v)">
          <input
            type="range"
            min="4"
            max="160"
            :value="pxNum(v)"
            @input="set(k, `${($event.target as HTMLInputElement).value}px`)"
          />
          <span class="val">{{ v }}</span>
        </template>
        <input
          v-else
          class="text"
          :value="v"
          @change="set(k, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>
    <div v-if="savedAt" class="saved">Written to source {{ savedAt }}</div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VueLogo from '@/components/VueLogo.vue'

const open = ref(false)
const vars = ref<Record<string, string>>({})
const savedAt = ref('')
const error = ref('')

const isColor = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v)
const isPx = (v: string) => /^\d+(\.\d+)?px$/.test(v)
const pxNum = (v: string) => Number(v.replace('px', ''))
const normalizeHex = (v: string) => (isColor(v) ? v : '#000000')

onMounted(async () => {
  const res = await fetch('/__tokens')
  const data = (await res.json()) as { vars: Record<string, string> }
  vars.value = data.vars
})

let timer: number | undefined

function set(name: string, value: string) {
  vars.value = { ...vars.value, [name]: value }
  error.value = ''
  // 1) Preview instantly: touch only the runtime variable
  document.documentElement.style.setProperty(name, value)
  // 2) Debounced write-back to source -> Vite HMR (and persistence into the git-visible css file)
  window.clearTimeout(timer)
  timer = window.setTimeout(async () => {
    try {
      const res = await fetch('/__tokens', {
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
</script>

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
.panel {
  position: fixed;
  right: 14px;
  bottom: 60px;
  width: 340px;
  max-height: 70vh;
  overflow: auto;
  background: var(--c-bg);
  border: 1px solid #262b38;
  border-radius: var(--radius-card);
  padding: 12px 14px;
  z-index: 30;
  color: var(--c-text);
  font-size: 13px;
}
.head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.tip {
  color: var(--c-text-muted);
  font-size: 11px;
  margin-right: auto;
}
.close {
  background: none;
  border: none;
  color: var(--c-text-muted);
  font-size: 16px;
  cursor: pointer;
}
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
</style>
