<template>
  <div class="home">
    <header class="hero">
      <div class="hero-title">
        <VueLogo :size="56" inner="var(--c-surface)" />
        <h1>Vue <span class="grad">Design Lab</span></h1>
      </div>
      <p class="desc">
        A poster workbench for designers. Every .vue file in src/pages/ becomes a route;
        declare data-export-w / data-export-h on the root element to enable export; the
        top-right panel edits design tokens and writes them back to tokens.css.
      </p>
      <code class="install">pnpm create vue-design-lab</code>
    </header>
    <div class="grid">
      <RouterLink v-for="r in routes" :key="r.path" :to="r.path" class="item">
        <b>{{ r.name }}</b>
        <span>{{ hints[r.name as string] ?? 'Custom page' }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import VueLogo from '@/components/VueLogo.vue'

const router = useRouter()
const routes = computed(() => router.getRoutes().filter((r) => r.name !== 'home'))

const hints: Record<string, string> = {
  CardBusiness: 'Business card 90x54mm - 340x204px',
  CardSquare: 'Social square - 1080x1080px',
  PosterA4: 'Product poster A4 - 794x1123px',
  PosterA5: 'Flyer A5 - 559x794px',
  PosterRollup: 'Brand rollup 85x200cm - 850x2000px',
  SlideWide: 'Slide 16:9 - 1920x1080px',
  SocialLandscape: 'Link card - 1200x630px',
  SocialStory: 'Story / Reels - 1080x1920px',
}
</script>

<style scoped>
.home {
  max-width: 760px;
  color: var(--c-text);
}
.hero {
  margin-bottom: 40px;
}
.hero-title {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
h1 {
  color: #fff;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.grad {
  background: linear-gradient(90deg, var(--c-brand-from), var(--c-brand-to));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.desc {
  color: var(--c-text-muted);
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 18px;
}
.install {
  display: inline-block;
  background: var(--c-surface);
  border: 1px solid #262b38;
  border-radius: 8px;
  padding: 7px 12px;
  color: var(--c-accent);
  font-size: 13px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.item {
  background: var(--c-surface);
  border: 1px solid #262b38;
  border-radius: var(--radius-card);
  padding: 20px;
  text-decoration: none;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.2s;
}
.item:hover {
  border-color: var(--c-accent);
}
.item span {
  color: var(--c-text-muted);
  font-size: 13px;
}
</style>
