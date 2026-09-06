<template>
  <div class="shell">
    <header class="topbar">
      <RouterLink class="brand" to="/">
        <VueLogo :size="20" inner="var(--c-bg)" />
        <span class="brand-name">Vue Design Lab</span>
      </RouterLink>
      <nav class="nav">
        <RouterLink v-for="r in materialRoutes" :key="r.name" :to="r.path">
          {{ r.name }}
        </RouterLink>
      </nav>
      <div class="spacer" />
      <TokenPanel />
    </header>

    <main class="stage">
      <StageZoom>
        <RouterView />
      </StageZoom>
    </main>

    <ExportBar v-if="route.name !== 'home'" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExportBar from './components/ExportBar.vue'
import StageZoom from './components/StageZoom.vue'
import TokenPanel from './components/TokenPanel.vue'
import VueLogo from './components/VueLogo.vue'

const route = useRoute()
const router = useRouter()

// Auto-discovered material pages (every route except home)
const materialRoutes = computed(() =>
  router.getRoutes().filter((r) => r.name && r.name !== 'home'),
)
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 18px;
  background: var(--c-bg);
  color: var(--c-text);
  border-bottom: 1px solid #262b38;
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}
.brand-name {
  font-weight: 700;
  font-size: 15px;
  background: linear-gradient(90deg, var(--c-brand-from), var(--c-brand-to));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.nav {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.nav a {
  color: var(--c-text-muted);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 14px;
}
.nav a.router-link-active {
  color: #fff;
  background: var(--c-surface);
}
.spacer {
  flex: 1;
}
.stage {
  flex: 1;
  /* pan/zoom viewport owns this area (see StageZoom); centering happens there */
  position: relative;
  overflow: hidden;
}
</style>
