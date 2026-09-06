<template>
  <div class="tpl">
    <header class="head">
      <h1>Templates</h1>
      <p class="desc">
        Pick a starter and set the canvas. Creating writes a real .vue file into
        src/pages/ - single file or folder with index.vue - and routes it immediately.
      </p>
    </header>

    <div class="cols">
      <div class="grid">
        <button class="cell" :class="{ active: selected === 'Blank' }" @click="select('Blank')">
          <div class="blank"><span>+</span></div>
          <b>Blank</b>
          <span>Start from scratch</span>
        </button>
        <button
          v-for="t in templates"
          :key="t.id"
          class="cell"
          :class="{ active: selected === t.id }"
          @click="select(t.id)"
        >
          <TemplatePreview :loader="t.loader" @size="(w, h) => setSize(t.id, w, h)" />
          <b>{{ t.id }}</b>
          <span v-if="metaOf(t.id).unit === 'mm'">
            {{ metaOf(t.id).mmW }} x {{ metaOf(t.id).mmH }}mm · {{ metaOf(t.id).dpi }}dpi
          </span>
          <span v-else>{{ t.w }}x{{ t.h }}px · screen format</span>
        </button>
      </div>

      <aside class="form">
        <h2>New material</h2>
        <p class="from">from <b>{{ selected }}</b></p>

        <label class="row">
          <span>Name</span>
          <input v-model="name" placeholder="MyPoster" spellcheck="false" />
        </label>

        <div class="row two">
          <label>
            <span>Unit</span>
            <select v-model="unit">
              <option value="px">px</option>
              <option value="mm">mm</option>
            </select>
          </label>
          <label v-if="unit === 'mm'">
            <span>DPI</span>
            <input v-model.number="dpi" type="number" min="24" max="1200" />
          </label>
        </div>

        <div class="row two">
          <label>
            <span>Width ({{ unit }})</span>
            <input v-model.number="w" type="number" min="1" />
          </label>
          <label>
            <span>Height ({{ unit }})</span>
            <input v-model.number="h" type="number" min="1" />
          </label>
        </div>
        <p class="hint">{{ pxHint }}</p>

        <div class="row col">
          <span>File shape</span>
          <div class="seg">
            <button type="button" :class="{ on: asDir }" @click="asDir = true">Folder + index.vue</button>
            <button type="button" :class="{ on: !asDir }" @click="asDir = false">Single file</button>
          </div>
          <p class="hint">{{ asDir ? `src/pages/${name || 'Name'}/index.vue` : `src/pages/${name || 'Name'}.vue` }}</p>
        </div>

        <button class="create" :disabled="busy || !name" @click="create">
          {{ busy ? 'Creating...' : 'Create material' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
        <p class="hint">
          Note: a template's layout is tuned for its native size; other canvases give
          you the frame to reflow.
        </p>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TemplatePreview from '@/components/TemplatePreview.vue'
import { TEMPLATE_META, type TemplateMeta } from '@/templates/meta'

type Tpl = { id: string; loader: () => Promise<{ default: unknown }>; w: number; h: number }

// Starter formats live in src/templates/ - previews only, never routed
const modules = import.meta.glob('../templates/*.vue')
const templates = ref<Tpl[]>(
  Object.entries(modules)
    .map(([file, loader]) => ({
      id: /([\w-]+)\.vue$/.exec(file)![1],
      loader: loader as () => Promise<{ default: unknown }>,
      w: 0,
      h: 0,
    }))
    .sort((a, b) => a.id.localeCompare(b.id)),
)

const metaOf = (id: string): TemplateMeta => TEMPLATE_META[id] ?? { unit: 'px', dpi: 96 }

function setSize(id: string, w: number, h: number) {
  const t = templates.value.find((x) => x.id === id)
  if (!t || t.w) return
  t.w = w
  t.h = h
}

const selected = ref('Blank')
const name = ref('')
const unit = ref<'px' | 'mm'>('px')
const dpi = ref(96)
const w = ref(1080)
const h = ref(1080)
const asDir = ref(true)
const busy = ref(false)
const error = ref('')

/** Selecting a template follows its canonical definition: mm at the
 *  recommended DPI for physical formats, native px for screen formats */
function select(id: string) {
  selected.value = id
  error.value = ''
  const t = templates.value.find((x) => x.id === id)
  const meta = id === 'Blank' ? undefined : metaOf(id)
  if (meta?.unit === 'mm' && meta.mmW && meta.mmH) {
    unit.value = 'mm'
    dpi.value = meta.dpi
    w.value = meta.mmW
    h.value = meta.mmH
  } else {
    unit.value = 'px'
    dpi.value = 96
    w.value = t?.w || 1080
    h.value = t?.h || 1080
  }
}

const toPx = (v: number) => (unit.value === 'mm' ? Math.round((v / 25.4) * dpi.value) : Math.round(v))
const pxHint = computed(() => {
  const pw = toPx(w.value)
  const ph = toPx(h.value)
  if (!pw || !ph) return ''
  const printNote = unit.value === 'mm' ? ' @ this DPI - raise to 150-300 for close-view print' : ''
  return `= ${pw} x ${ph} px${printNote}`
})

/** Manually switching the unit converts the current values, so nothing jumps */
watch(unit, (next, prev) => {
  if (next === prev) return
  if (next === 'mm') {
    w.value = Math.round((w.value / dpi.value) * 25.4)
    h.value = Math.round((h.value / dpi.value) * 25.4)
  } else {
    w.value = Math.round((w.value / 25.4) * dpi.value)
    h.value = Math.round((h.value / 25.4) * dpi.value)
  }
})

async function create() {
  busy.value = true
  error.value = ''
  try {
    const res = await fetch('/__pages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name.value,
        template: selected.value,
        unit: unit.value,
        dpi: dpi.value,
        w: w.value,
        h: h.value,
        asDir: asDir.value,
      }),
    })
    if (res.ok) {
      const { route } = (await res.json()) as { route: string }
      // full load: the fresh glob then includes the new file
      window.location.assign(route)
    } else {
      error.value = await res.text()
    }
  } catch {
    error.value = 'Create failed: dev server unreachable'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.tpl {
  width: 1080px;
  max-width: 100%;
  color: var(--c-text);
}
.head {
  margin-bottom: 28px;
}
h1 {
  color: #fff;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}
.desc {
  color: var(--c-text-muted);
  font-size: 14px;
  line-height: 1.7;
  max-width: 640px;
}
.cols {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 22px;
  align-items: start;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}
.cell {
  background: var(--c-surface);
  border: 1px solid #262b38;
  border-radius: var(--radius-card);
  padding: 12px;
  text-align: left;
  cursor: pointer;
  color: var(--c-text);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s;
}
.cell:hover {
  border-color: #3a4152;
}
.cell.active {
  border-color: var(--c-accent);
}
.cell b {
  color: #fff;
  font-size: 14px;
}
.cell span {
  color: var(--c-text-muted);
  font-size: 11.5px;
}
.blank {
  height: 150px;
  border: 1px dashed #3a4152;
  border-radius: 8px;
  display: grid;
  place-items: center;
}
.blank span {
  font-size: 34px;
  font-weight: 300;
  color: var(--c-accent);
  line-height: 1;
}
.form {
  position: sticky;
  top: 70px;
  background: var(--c-surface);
  border: 1px solid #262b38;
  border-radius: var(--radius-card);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
h2 {
  color: #fff;
  font-size: 17px;
  font-weight: 700;
}
.from {
  color: var(--c-text-muted);
  font-size: 12px;
  margin-top: -8px;
}
.from b {
  color: var(--c-accent);
}
.row {
  display: grid;
  gap: 6px;
}
.row.two {
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.row.col {
  gap: 8px;
}
.row > span {
  color: var(--c-text-muted);
  font-size: 12px;
}
input,
select {
  background: var(--c-bg);
  border: 1px solid #262b38;
  border-radius: 6px;
  color: var(--c-text);
  font-size: 13px;
  padding: 7px 9px;
  width: 100%;
}
input:focus,
select:focus {
  outline: none;
  border-color: var(--c-accent);
}
.seg {
  display: flex;
  gap: 6px;
}
.seg button {
  flex: 1;
  background: var(--c-bg);
  border: 1px solid #262b38;
  border-radius: 6px;
  color: var(--c-text-muted);
  font-size: 12px;
  padding: 7px 4px;
  cursor: pointer;
}
.seg button.on {
  border-color: var(--c-accent);
  color: #fff;
}
.hint {
  color: #6c7484;
  font-size: 11.5px;
  line-height: 1.5;
}
.create {
  background: var(--c-accent);
  border: none;
  border-radius: 8px;
  color: var(--c-bg);
  font-weight: 600;
  font-size: 14px;
  padding: 10px;
  cursor: pointer;
}
.create:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.error {
  color: #f87171;
  font-size: 12px;
  line-height: 1.5;
}
</style>
