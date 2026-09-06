<!-- Created from template PosterA5 -> src/pages/AsdP/index.vue (559x794px) -->
<template>
  <div class="poster" data-export data-export-w="559" data-export-h="794" style="width: 559px; height: 794px">
    <header>
      <VueLogo :size="34" outer="#ffffff" inner="var(--c-bg)" />
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
        <p>One-click PNG at 2x, sized PDF, or browser print</p>
      </div>
    </div>
    <footer>
      <p class="cmd">pnpm create vue-design-lab</p>
      <p class="small">VUE DESIGN LAB</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import VueLogo from '@/components/VueLogo.vue'
</script>

<style scoped>
/* A5 flyer: 148x210mm at 96dpi = 559x794px; the A4 poster condensed */
.poster {
  width: 559px;
  height: 794px;
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
  gap: 14px;
  padding: 40px 32px 26px;
}
h1 {
  font-size: 27px;
  letter-spacing: -0.02em;
  font-weight: 800;
}
.en {
  color: var(--c-accent-soft);
  letter-spacing: 0.24em;
  margin-top: 5px;
  font-size: 9px;
}
.body {
  flex: 1;
  padding: 0 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
/* Info blocks use dividers instead of cards; whitespace does the grouping */
.block {
  border-top: 1px solid rgba(246, 246, 246, 0.14);
  padding-top: 14px;
}
.block h2 {
  color: var(--c-accent);
  font-size: 14px;
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}
.block p {
  color: var(--c-text);
  font-size: 13px;
  line-height: 1.6;
}
footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  background: linear-gradient(90deg, var(--c-brand-from), var(--c-brand-to));
  padding: 20px 32px;
}
.cmd {
  color: var(--c-bg);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.small {
  color: rgba(18, 21, 28, 0.75);
  font-size: 8.5px;
  letter-spacing: 0.2em;
}
</style>
