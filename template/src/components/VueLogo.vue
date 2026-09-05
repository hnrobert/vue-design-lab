<template>
  <!-- Official Vue double-triangle logo; fill values accept CSS variables,
       so token panel edits restyle the logo too -->
  <svg :width="size" :height="size" viewBox="0 0 128 128" aria-hidden="true">
    <path :fill="outer" d="M78.8 10 64 35.4 49.2 10H0l64 110L128 10z" />
    <path :fill="inner" d="M78.8 10 64 35.4 49.2 10H25.6L64 76l38.4-66z" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
    outer?: string
    inner?: string
  }>(),
  {
    size: 24,
    outer: '#42d392',
    inner: 'var(--c-bg)',
  },
)
</script>
