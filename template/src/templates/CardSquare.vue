<template>
  <div class="card" data-export data-export-w="1080" data-export-h="1080">
    <div class="top">
      <VueLogo :size="88" outer="#ffffff" inner="var(--c-bg)" />
      <p class="kicker">VUE DESIGN LAB</p>
    </div>
    <h1>Design Posters<br />with Code</h1>
    <p class="sub">A WORKBENCH FOR DESIGNERS</p>
    <div class="meta">
      <p class="cmd">pnpm create vue-design-lab</p>
      <p>Drop a .vue · tune tokens · print-ready export</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueLogo from '@/components/VueLogo.vue'
</script>

<style scoped>
/* Social square: 1080x1080, full-bleed Vue brand gradient */
.card {
  width: 1080px;
  height: 1080px;
  background: linear-gradient(150deg, var(--c-brand-from), var(--c-brand-to));
  color: #fff;
  padding: 90px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kicker {
  color: #fff;
  background: rgba(18, 21, 28, 0.5);
  padding: 10px 22px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 24px;
  letter-spacing: 0.16em;
}
h1 {
  font-size: calc(var(--fs-title) * 1.6);
  line-height: 1.08;
  letter-spacing: -0.02em;
  font-weight: 800;
  margin-top: auto;
}
.sub {
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.34em;
  font-size: 22px;
  margin-top: 30px;
}
.meta {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.35);
  padding-top: 26px;
  color: rgba(255, 255, 255, 0.92);
  font-size: var(--fs-body);
  line-height: 1.7;
}
/* The install command is the CTA line - bold and tight */
.cmd {
  font-weight: 800;
  letter-spacing: 0.01em;
}
</style>
