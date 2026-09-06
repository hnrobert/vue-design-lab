<template>
  <div class="slide" data-export data-export-w="1920" data-export-h="1080">
    <VueLogo class="watermark" :size="380" outer="rgba(246, 246, 246, 0.07)" inner="rgba(246, 246, 246, 0.03)" />
    <header>
      <VueLogo :size="44" inner="var(--c-bg)" />
      <span class="wordmark">Vue Design Lab</span>
    </header>
    <div class="middle">
      <p class="kicker">VUE DESIGN LAB</p>
      <h1>Design posters<br />with code</h1>
    </div>
    <footer>
      <code class="cmd">pnpm create vue-design-lab</code>
      <span class="note">DROP A .VUE · TUNE TOKENS · EXPORT PRINT</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import VueLogo from '@/components/VueLogo.vue'
</script>

<style scoped>
/* Presentation slide: 16:9 = 1920x1080px */
.slide {
  width: 1920px;
  height: 1080px;
  background: var(--c-bg);
  color: var(--c-text);
  padding: 110px 130px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
/* Faint giant logo as backdrop craft; both fills stay whisper-subtle */
.watermark {
  position: absolute;
  right: 120px;
  top: 50%;
  transform: translateY(-50%);
}
header {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
}
.wordmark {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.middle {
  margin: auto 0;
  position: relative;
}
.kicker {
  color: var(--c-accent-soft);
  font-size: 22px;
  letter-spacing: 0.32em;
  margin-bottom: 26px;
}
h1 {
  font-size: 150px;
  line-height: 1.04;
  letter-spacing: -0.02em;
  font-weight: 800;
  color: #fff;
}
footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  border-top: 1px solid rgba(246, 246, 246, 0.14);
  padding-top: 28px;
  position: relative;
}
.cmd {
  color: var(--c-accent);
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.note {
  color: var(--c-text-muted);
  font-size: 15px;
  letter-spacing: 0.18em;
}
</style>
