<template>
  <div class="home">
    <header class="hero">
      <div class="hero-title">
        <VueLogo :size="56" inner="var(--c-surface)" />
        <h1>Vue <span class="grad">Design Lab</span></h1>
      </div>
      <p class="desc">
        Your material workbench. Everything under src/pages/ is a live page - create
        from a template below, or drop a .vue file in. Declare data-export-w/h to
        enable export; the top-right panel writes tokens back to source.
      </p>
      <div class="actions">
        <RouterLink class="cta" to="/templates">New material</RouterLink>
        <code class="install">pnpm create vue-design-lab</code>
      </div>
    </header>

    <div v-if="routes.length" class="grid">
      <RouterLink v-for="r in routes" :key="r.path" :to="r.path" class="item">
        <b>{{ r.name }}</b>
        <span>Custom page</span>
      </RouterLink>
    </div>
    <RouterLink v-else class="empty" to="/templates">
      <span class="plus">+</span>
      <b>No materials yet</b>
      <span>Pick a template, set the canvas - the .vue file lands in src/pages/ for real.</span>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import VueLogo from '../components/VueLogo.vue'

const router = useRouter()
// Only the user's own pages (src/pages/), not the shell routes
const routes = computed(() =>
  router.getRoutes().filter((r) => r.name && r.name !== 'home' && r.name !== 'Templates'),
)
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
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.cta {
  background: var(--c-accent);
  color: var(--c-bg);
  font-weight: 600;
  font-size: 14px;
  border-radius: 8px;
  padding: 8px 16px;
  text-decoration: none;
}
.cta:hover {
  filter: brightness(1.08);
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
/* Composed empty state: tells you exactly how to populate it */
.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  border: 1px dashed #3a4152;
  border-radius: var(--radius-card);
  padding: 36px 32px;
  text-decoration: none;
  color: var(--c-text);
  transition: border-color 0.2s;
}
.empty:hover {
  border-color: var(--c-accent);
}
.plus {
  font-size: 34px;
  font-weight: 300;
  color: var(--c-accent);
  line-height: 1;
}
.empty b {
  color: #fff;
  font-size: 17px;
}
.empty span {
  color: var(--c-text-muted);
  font-size: 13px;
  line-height: 1.6;
}
</style>
