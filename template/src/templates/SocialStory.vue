<template>
  <div class="story" data-export data-export-w="1080" data-export-h="1920">
    <VueLogo class="mark" :size="150" outer="#ffffff" inner="var(--c-bg)" />
    <div class="middle">
      <h1>Design<br />posters<br />with code</h1>
      <p class="sub">VUE DESIGN LAB</p>
    </div>
    <div class="cta">
      <code class="cmd">pnpm create vue-design-lab</code>
      <p class="note">Drop a .vue · tune tokens · print-ready export</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueLogo from '@/components/VueLogo.vue'
</script>

<style scoped>
/* Vertical story / reels: 1080x1920px, full-bleed Vue brand gradient */
.story {
  width: 1080px;
  height: 1920px;
  background: linear-gradient(150deg, var(--c-brand-from), var(--c-brand-to));
  color: #fff;
  padding: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
  flex-shrink: 0;
}
.mark {
  margin-top: 120px;
}
.middle {
  margin: auto 0;
}
h1 {
  font-size: 128px;
  line-height: 1.06;
  letter-spacing: -0.02em;
  font-weight: 800;
}
.sub {
  color: rgba(255, 255, 255, 0.9);
  font-size: 26px;
  letter-spacing: 0.34em;
  margin-top: 44px;
}
/* Glass card CTA anchored to the bottom, thumb-safe zone */
.cta {
  width: 100%;
  background: rgba(18, 21, 28, 0.5);
  border-radius: var(--radius-card);
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
}
.cmd {
  color: #fff;
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 0.01em;
}
.note {
  color: rgba(255, 255, 255, 0.85);
  font-size: 23px;
  line-height: 1.5;
}
</style>
