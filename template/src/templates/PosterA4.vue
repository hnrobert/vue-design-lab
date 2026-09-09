<template>
  <div class="poster" data-export data-export-w="794" data-export-h="1123">
    <header>
      <VueLogo :size="46" outer="#ffffff" inner="var(--c-bg)" />
      <div>
        <h1>Vue Design Lab</h1>
        <p class="en">A POSTER WORKBENCH FOR DESIGNERS</p>
      </div>
    </header>
    <div class="body">
      <div class="block">
        <h2>Drop a file</h2>
        <p>Every .vue under src/pages/ becomes a page — no routes to wire, no config</p>
      </div>
      <div class="block">
        <h2>Tune tokens live</h2>
        <p>Colors and sizes preview instantly, then write back to tokens.css source</p>
      </div>
      <div class="block">
        <h2>Export anywhere</h2>
        <p>One-click PNG at 2x, sized PDF, or browser print — pixels match the canvas</p>
      </div>
    </div>
    <footer>
      <div class="qr"><div class="qr-inner" /></div>
      <div class="cta">
        <p class="big">pnpm create vue-design-lab</p>
        <p class="small">VUE DESIGN LAB · SCAN TO START</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import VueLogo from 'vue-design-lab/components/VueLogo.vue'
</script>

<style scoped>
.poster {
  width: 794px;
  height: 1123px;
  background: var(--c-bg);
  color: var(--c-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}
header {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 64px 60px 44px;
}
h1 {
  font-size: calc(var(--fs-title) * 0.62);
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-weight: 800;
}
.en {
  color: var(--c-accent-soft);
  letter-spacing: 0.28em;
  margin-top: 10px;
  font-size: 14px;
}
.body {
  flex: 1;
  padding: 0 60px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}
/* Info blocks use dividers instead of cards; whitespace does the grouping */
.block {
  border-top: 1px solid rgba(246, 246, 246, 0.14);
  padding-top: 22px;
}
.block h2 {
  color: var(--c-accent);
  font-size: 22px;
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}
.block p {
  color: var(--c-text);
  font-size: calc(var(--fs-body) * 0.6);
  line-height: 1.6;
}
footer {
  display: flex;
  align-items: center;
  gap: 36px;
  background: linear-gradient(90deg, var(--c-brand-from), var(--c-brand-to));
  padding: 36px 60px;
}
.qr {
  width: 150px;
  height: 150px;
  background: #fff;
  border-radius: var(--radius-card);
  display: grid;
  place-items: center;
}
.qr-inner {
  width: 96px;
  height: 96px;
  background: var(--c-bg);
  border-radius: 6px;
  position: relative;
}
.qr-inner::before {
  content: '';
  position: absolute;
  inset: 22px;
  background: #fff;
}
/* The install command as the CTA: tight tracking, not slogan spacing */
.cta .big {
  color: var(--c-bg);
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.cta .small {
  color: rgba(18, 21, 28, 0.75);
  font-size: 13px;
  margin-top: 8px;
  letter-spacing: 0.2em;
}
</style>
