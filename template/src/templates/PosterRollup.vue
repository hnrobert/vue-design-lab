<template>
  <div class="poster" data-export data-export-w="2409" data-export-h="5669">
    <div class="glow" />
    <div class="content">
      <VueLogo class="mark" :size="482" outer="#ffffff" inner="var(--c-bg)" />
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
/* Brand rollup: physical 850x2000mm at a 72dpi design canvas = 2409x5669px.
   Everything reads tokens - changing one in TokenPanel changes this page */
.poster {
  width: 2409px;
  height: 5669px;
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
  left: 326px;
  top: -397px;
  width: 1757px;
  height: 1757px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c-brand-from), var(--c-brand-to));
}
.content {
  position: absolute;
  inset: 0;
}
.mark {
  position: absolute;
  top: 425px;
  left: 50%;
  transform: translateX(-50%);
}
h1 {
  position: absolute;
  top: 1190px;
  left: 0;
  right: 0;
  /* canvas is 2.83x the token scale the other posters use */
  font-size: calc(var(--fs-title) * 2.83);
  line-height: 1.16;
  letter-spacing: -0.02em;
  font-weight: 800;
}
.en {
  position: absolute;
  top: 1956px;
  left: 0;
  right: 0;
  font-size: 74px;
  letter-spacing: 0.32em;
  color: var(--c-accent-soft);
}
.divider {
  position: absolute;
  top: 2188px;
  left: 921px;
  width: 567px;
  height: 14px;
  background: linear-gradient(90deg, var(--c-brand-from), var(--c-brand-to));
}
.line {
  position: absolute;
  left: 0;
  right: 0;
  font-size: calc(var(--fs-body) * 2.83);
  color: var(--c-text);
}
/* Position via explicit classes: .en is a p too, nth-of-type would miscount */
.line-date {
  top: 2409px;
}
.line-venue {
  top: 2619px;
}
.qr {
  position: absolute;
  top: 4025px;
  left: 50%;
  transform: translateX(-50%);
  width: 623px;
  height: 623px;
  background: #fff;
  border-radius: var(--radius-card);
  display: grid;
  place-items: center;
}
.qr-inner {
  width: 397px;
  height: 397px;
  background: var(--c-bg);
  border-radius: 16px;
  position: relative;
}
.qr-inner::before,
.qr-inner::after {
  content: '';
  position: absolute;
  width: 102px;
  height: 102px;
  background: #fff;
}
.qr-inner::before {
  left: 45px;
  top: 45px;
}
.qr-inner::after {
  right: 45px;
  bottom: 45px;
}
.caption {
  position: absolute;
  top: 4727px;
  left: 0;
  right: 0;
  font-size: 79px;
  letter-spacing: 0.24em;
}
footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 397px;
  background: linear-gradient(90deg, var(--c-brand-from), var(--c-brand-to));
  display: grid;
  place-items: center;
}
/* The install command is the slogan - tight tracking, unlike slogan text */
footer p {
  color: var(--c-bg);
  font-weight: 700;
  font-size: 79px;
  letter-spacing: 0.02em;
}
</style>
