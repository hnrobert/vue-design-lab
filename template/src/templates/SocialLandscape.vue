<template>
  <div class="card" data-export data-export-w="1200" data-export-h="630">
    <header>
      <VueLogo :size="56" outer="#ffffff" inner="var(--c-bg)" />
      <p class="kicker">VUE DESIGN LAB</p>
    </header>
    <h1>Design posters<br />with code</h1>
    <footer>
      <code class="cmd">pnpm create vue-design-lab</code>
      <span class="note">DROP A .VUE · TUNE TOKENS · EXPORT PRINT</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import VueLogo from 'vue-design-lab/components/VueLogo.vue'
</script>

<style scoped>
/* Link / Open Graph card: 1200x630px, full-bleed Vue brand gradient */
.card {
  width: 1200px;
  height: 630px;
  background: linear-gradient(135deg, var(--c-brand-from), var(--c-brand-to));
  color: #fff;
  padding: 72px 80px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kicker {
  color: #fff;
  background: rgba(18, 21, 28, 0.5);
  padding: 8px 18px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.16em;
}
h1 {
  font-size: 88px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-weight: 800;
  margin: auto 0;
}
footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.35);
  padding-top: 22px;
}
.cmd {
  color: #fff;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: 0.01em;
}
.note {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  letter-spacing: 0.18em;
}
</style>
