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
        <RouterLink to="/templates">Templates</RouterLink>
      </nav>
      <div class="spacer" />
      <button
        class="font-refresh"
        :class="{ done }"
        :disabled="busy"
        :title="busy ? 'Reloading fonts...' : 'Reload fonts (bypass cache)'"
        @click="reloadFonts"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>
      <TokenPanel />
    </header>

    <main class="stage">
      <StageZoom>
        <RouterView />
      </StageZoom>
    </main>

    <ExportBar v-if="route.name !== 'home' && route.name !== 'Templates'" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExportBar from './components/ExportBar.vue'
import StageZoom from './components/StageZoom.vue'
import TokenPanel from './components/TokenPanel.vue'
import VueLogo from './components/VueLogo.vue'
import { refreshFonts } from '@/utils/fonts'

const route = useRoute()
const router = useRouter()

// Font cache buster: rewrites every @font-face with cache-busted urls
// and waits for the fresh files - no page reload
const busy = ref(false)
const done = ref(false)

async function reloadFonts() {
  busy.value = true
  try {
    await refreshFonts()
    done.value = true
    setTimeout(() => (done.value = false), 1200)
  } finally {
    busy.value = false
  }
}

// Auto-discovered user material pages (routes from src/pages/, not the shell pages)
const materialRoutes = computed(() =>
  router
    .getRoutes()
    .filter((r) => r.name && r.name !== 'home' && r.name !== 'Templates'),
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
.font-refresh {
  display: grid;
  place-items: center;
  background: var(--c-surface);
  border: 1px solid #262b38;
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--c-text-muted);
  cursor: pointer;
}
.font-refresh:hover {
  color: #fff;
}
.font-refresh:disabled {
  cursor: wait;
}
.font-refresh:disabled svg {
  animation: spin 0.8s linear infinite;
}
.font-refresh.done {
  color: var(--c-accent);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.stage {
  flex: 1;
  /* pan/zoom viewport owns this area (see StageZoom); centering happens there */
  position: relative;
  overflow: hidden;
}
</style>
