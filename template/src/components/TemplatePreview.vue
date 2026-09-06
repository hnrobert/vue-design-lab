<template>
  <div ref="boxEl" class="box">
    <div class="fit" :style="fitStyle">
      <component :is="comp" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'

/**
 * Scaled-down live preview of a template: mounts the real component at its
 * natural canvas size, then transforms it to fit the preview box.
 * Reports the natural size (from data-export-w/h) back to the parent.
 */
const props = defineProps<{ loader: () => Promise<{ default: unknown }> }>()
const emit = defineEmits<{ size: [w: number, h: number] }>()

const comp = shallowRef()
const boxEl = ref<HTMLElement>()
const scale = ref(0)
const left = ref(0)
const top = ref(0)

const fitStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  left: `${left.value}px`,
  top: `${top.value}px`,
  opacity: scale.value ? '1' : '0',
}))

onMounted(async () => {
  comp.value = (await props.loader()).default
  await nextTick()
  const box = boxEl.value
  if (!box) return
  const el = box.querySelector<HTMLElement>('[data-export]')
  const w = Number(el?.dataset.exportW ?? 0)
  const h = Number(el?.dataset.exportH ?? 0)
  if (!w || !h) return
  emit('size', w, h)
  scale.value = Math.min(box.clientWidth / w, box.clientHeight / h)
  left.value = (box.clientWidth - w * scale.value) / 2
  top.value = (box.clientHeight - h * scale.value) / 2
})
</script>

<style scoped>
.box {
  height: 150px;
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  background: #0d0f15;
}
.fit {
  position: absolute;
  transform-origin: 0 0;
  /* previews are never interactive */
  pointer-events: none;
}
</style>
