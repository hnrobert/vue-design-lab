<template>
  <div class="poster" data-export data-export-w="850" data-export-h="2000">
    <div class="glow" />
    <div class="content">
      <VueLogo class="mark" :size="170" outer="#ffffff" inner="var(--c-bg)" />
      <h1>Design Posters<br />with Code</h1>
      <p class="en">VUE DESIGN LAB</p>
      <div class="divider" />
      <p class="line line-date">Drop a .vue file, get a poster</p>
      <p class="line line-venue">One-click PNG / PDF export</p>
      <div class="qr"><div class="qr-inner" /></div>
      <p class="caption">SCAN TO START</p>
    </div>
    <footer><p>pnpm create vue-design-lab</p></footer>
  </div>
</template>

<script setup lang="ts">
import VueLogo from '@/components/VueLogo.vue'
</script>

<style scoped>
/* Everything reads tokens - changing one in TokenPanel changes this page */
.poster {
  width: 850px;
  height: 2000px;
  background: var(--c-bg);
  position: relative;
  overflow: hidden;
  color: var(--c-text);
  text-align: center;
  flex-shrink: 0;
}
/* Vue brand-gradient orb peeking in from the top */
.glow {
  position: absolute;
  left: 115px;
  top: -140px;
  width: 620px;
  height: 620px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-brand-from), var(--c-brand-to));
}
.content {
  position: absolute;
  inset: 0;
}
.mark {
  position: absolute;
  top: 150px;
  left: 50%;
  transform: translateX(-50%);
}
h1 {
  position: absolute;
  top: 420px;
  left: 0;
  right: 0;
  font-size: var(--fs-title);
  line-height: 1.16;
  letter-spacing: -0.02em;
  font-weight: 800;
}
.en {
  position: absolute;
  top: 690px;
  left: 0;
  right: 0;
  font-size: 26px;
  letter-spacing: 0.32em;
  color: var(--c-accent-soft);
}
.divider {
  position: absolute;
  top: 772px;
  left: 325px;
  width: 200px;
  height: 5px;
  background: linear-gradient(90deg, var(--c-brand-from), var(--c-brand-to));
}
.line {
  position: absolute;
  left: 0;
  right: 0;
  font-size: var(--fs-body);
  color: var(--c-text);
}
/* Position via explicit classes: .en is a p too, nth-of-type would miscount */
.line-date {
  top: 850px;
}
.line-venue {
  top: 924px;
}
.qr {
  position: absolute;
  top: 1420px;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  height: 220px;
  background: #fff;
  border-radius: var(--radius-card);
  display: grid;
  place-items: center;
}
.qr-inner {
  width: 140px;
  height: 140px;
  background: var(--c-bg);
  border-radius: 6px;
  position: relative;
}
.qr-inner::before,
.qr-inner::after {
  content: '';
  position: absolute;
  width: 36px;
  height: 36px;
  background: #fff;
}
.qr-inner::before {
  left: 16px;
  top: 16px;
}
.qr-inner::after {
  right: 16px;
  bottom: 16px;
}
.caption {
  position: absolute;
  top: 1668px;
  left: 0;
  right: 0;
  font-size: 26px;
  letter-spacing: 0.24em;
}
footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 140px;
  background: linear-gradient(90deg, var(--c-brand-from), var(--c-brand-to));
  display: grid;
  place-items: center;
}
/* The install command is the slogan - tight tracking, unlike slogan text */
footer p {
  color: var(--c-bg);
  font-weight: 700;
  font-size: 28px;
  letter-spacing: 0.02em;
}
</style>
