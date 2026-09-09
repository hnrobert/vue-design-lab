<template>
  <div class="card" data-export data-export-w="340" data-export-h="204">
    <div class="edge" />
    <div class="top">
      <VueLogo :size="36" inner="var(--c-bg)" />
      <div class="who">
        <p class="name">Vue Design Lab</p>
        <p class="tagline">Design posters with code</p>
      </div>
    </div>
    <div class="bottom">
      <code class="cmd">pnpm create vue-design-lab</code>
      <span class="site">vue-design-lab</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueLogo from 'vue-design-lab/components/VueLogo.vue'
</script>

<style scoped>
/* Business card: 90x54mm at 96dpi = 340x204px; type scale is card-local */
.card {
  width: 340px;
  height: 204px;
  background: var(--c-bg);
  color: var(--c-text);
  padding: 24px 24px 20px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.edge {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--c-brand-from), var(--c-brand-to));
}
.top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.name {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.tagline {
  color: var(--c-text-muted);
  font-size: 10.5px;
  margin-top: 3px;
  letter-spacing: 0.04em;
}
.bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
/* The install command: tight tracking, it is code not a slogan */
.cmd {
  color: var(--c-accent);
  font-size: 11px;
  letter-spacing: 0.01em;
}
.site {
  color: var(--c-text-muted);
  font-size: 10px;
  letter-spacing: 0.14em;
}
</style>
