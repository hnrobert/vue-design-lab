<template>
  <div
    ref="viewportEl"
    class="viewport"
    :class="{ dragging }"
    @wheel="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @click.capture="onClickCapture"
  >
    <div class="zoom-canvas" :style="canvasStyle">
      <slot />
    </div>
  </div>
  <div class="zoom-bar">
    <button title="Zoom out" @click="zoomStep(1 / 1.2)">−</button>
    <button class="pct" title="Reset to 100%" @click="zoomToScale(1)">{{ pct }}</button>
    <button title="Zoom in" @click="zoomStep(1.2)">+</button>
    <button class="fit" title="Fit to view" @click="fit">Fit</button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Pan/zoom viewport for the material stage.
 *
 * Gestures:
 * - trackpad pinch (wheel + ctrlKey) and ctrl/cmd + wheel -> zoom at the focal point
 * - two-finger scroll -> pan
 * - drag / one-finger touch -> pan; two-pointer touch -> pinch zoom
 * - Safari desktop also fires non-standard gesturestart/gesturechange
 *
 * The transform lives on the .zoom-canvas wrapper, never on the material itself,
 * so PNG/PDF export (which reads the [data-export] node) is unaffected.
 */
const MIN_SCALE = 0.1
const MAX_SCALE = 3
const FIT_MARGIN = 32

const route = useRoute()
const viewportEl = ref<HTMLElement>()
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const dragging = ref(false)
const userZoomed = ref(false)

const canvasStyle = computed(() => ({
  transform: `translate(${tx.value}px, ${ty.value}px) scale(${scale.value})`,
}))
const pct = computed(() => `${Math.round(scale.value * 100)}%`)

/** Natural (unzoomed) size of the slotted content */
function contentSize(): { w: number; h: number } {
  const canvas = viewportEl.value?.querySelector('.zoom-canvas') as HTMLElement | null
  return canvas ? { w: canvas.offsetWidth, h: canvas.offsetHeight } : { w: 0, h: 0 }
}

/** Keep the scaled material overlapping the viewport: center when smaller, clamp when larger */
function clampPan() {
  const vp = viewportEl.value
  if (!vp) return
  const { w, h } = contentSize()
  const sw = w * scale.value
  const sh = h * scale.value
  tx.value = sw <= vp.clientWidth ? (vp.clientWidth - sw) / 2 : Math.min(0, Math.max(vp.clientWidth - sw, tx.value))
  ty.value = sh <= vp.clientHeight ? (vp.clientHeight - sh) / 2 : Math.min(0, Math.max(vp.clientHeight - sh, ty.value))
}

/** Zoom to an absolute scale keeping the given viewport point stationary */
function zoomToScale(next: number, cx?: number, cy?: number) {
  const vp = viewportEl.value
  if (!vp) return
  const s2 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next))
  const fx = cx ?? vp.clientWidth / 2
  const fy = cy ?? vp.clientHeight / 2
  const px = (fx - tx.value) / scale.value
  const py = (fy - ty.value) / scale.value
  scale.value = s2
  tx.value = fx - px * s2
  ty.value = fy - py * s2
  userZoomed.value = true
  clampPan()
}

const zoomStep = (factor: number) => zoomToScale(scale.value * factor)

/** Fit the whole material into view with a margin; the initial state on every page */
function fit() {
  const vp = viewportEl.value
  if (!vp) return
  const { w, h } = contentSize()
  if (!w || !h) return
  const s = Math.min((vp.clientWidth - FIT_MARGIN) / w, (vp.clientHeight - FIT_MARGIN) / h, 1)
  scale.value = s
  tx.value = (vp.clientWidth - w * s) / 2
  ty.value = (vp.clientHeight - h * s) / 2
  userZoomed.value = false
}

// ---------- wheel: pinch (ctrl/meta) zooms, plain scroll pans ----------
function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.ctrlKey || e.metaKey) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    zoomToScale(scale.value * Math.exp(-e.deltaY * 0.01), e.clientX - rect.left, e.clientY - rect.top)
  } else {
    tx.value -= e.deltaX
    ty.value -= e.deltaY
    userZoomed.value = true
    clampPan()
  }
}

// ---------- pointer: drag pans, two pointers pinch ----------
const pointers = new Map<number, { x: number; y: number }>()
let dragFrom = { x: 0, y: 0, tx: 0, ty: 0 }
let pinchBase = { dist: 1, scale: 1 }
let suppressClick = false

const pinchDist = () => {
  const [a, b] = [...pointers.values()]
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function onPointerDown(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    pinchBase = { dist: pinchDist() || 1, scale: scale.value }
    dragging.value = false
  } else if (pointers.size === 1) {
    dragFrom = { x: e.clientX, y: e.clientY, tx: tx.value, ty: ty.value }
    dragging.value = true
  }
}

function onPointerMove(e: PointerEvent) {
  if (!pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size >= 2) {
    const vp = viewportEl.value!
    const rect = vp.getBoundingClientRect()
    const [a, b] = [...pointers.values()]
    zoomToScale(pinchBase.scale * (pinchDist() / pinchBase.dist), (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top)
  } else if (dragging.value) {
    if (Math.abs(e.clientX - dragFrom.x) + Math.abs(e.clientY - dragFrom.y) > 4) suppressClick = true
    tx.value = dragFrom.tx + (e.clientX - dragFrom.x)
    ty.value = dragFrom.ty + (e.clientY - dragFrom.y)
    userZoomed.value = true
    clampPan()
  }
}

function onPointerUp(e: PointerEvent) {
  pointers.delete(e.pointerId)
  if (pointers.size === 1) {
    // resume single-pointer drag from the remaining finger
    const p = [...pointers.values()][0]
    dragFrom = { x: p.x, y: p.y, tx: tx.value, ty: ty.value }
    dragging.value = true
  } else if (pointers.size === 0) {
    dragging.value = false
  }
}

/** A pan gesture must not turn into a click on whatever is under the cursor */
function onClickCapture(e: MouseEvent) {
  if (suppressClick) {
    e.stopPropagation()
    e.preventDefault()
    suppressClick = false
  }
}

// ---------- Safari desktop pinch (non-standard gesture events) ----------
let gestureBase = 1
const onGestureStart = (e: Event) => {
  e.preventDefault()
  gestureBase = scale.value
}
const onGestureChange = (e: Event) => {
  e.preventDefault()
  zoomToScale(gestureBase * (e as unknown as { scale: number }).scale)
}

// ---------- lifecycle ----------
function onResize() {
  if (userZoomed.value) clampPan()
  else fit()
}

onMounted(async () => {
  const vp = viewportEl.value!
  vp.addEventListener('gesturestart', onGestureStart)
  vp.addEventListener('gesturechange', onGestureChange)
  window.addEventListener('resize', onResize)
  await nextTick()
  fit()
})

// Every page change re-fits: materials have very different canvas sizes
watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    fit()
  },
)

onBeforeUnmount(() => {
  viewportEl.value?.removeEventListener('gesturestart', onGestureStart)
  viewportEl.value?.removeEventListener('gesturechange', onGestureChange)
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  cursor: grab;
  /* pan and pinch are ours; the page itself never scrolls */
  touch-action: none;
}
.viewport.dragging {
  cursor: grabbing;
}
.zoom-canvas {
  position: absolute;
  left: 0;
  top: 0;
  width: max-content;
  transform-origin: 0 0;
}
.zoom-bar {
  position: fixed;
  left: 14px;
  bottom: 66px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--c-bg);
  border: 1px solid #262b38;
  border-radius: 8px;
  padding: 4px;
  z-index: 20;
}
.zoom-bar button {
  background: none;
  border: none;
  color: var(--c-text-muted);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  min-width: 28px;
}
.zoom-bar button:hover {
  background: var(--c-surface);
  color: #fff;
}
.pct {
  font-size: 12px;
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.fit {
  font-size: 12px;
}
</style>
