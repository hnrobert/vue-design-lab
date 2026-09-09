import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/base.css'

/**
 * Mount the workbench: shell (topbar / stage / export bar / token panel),
 * auto routing over the host's src/pages/, and base styles with the bundled
 * Inter Variable font. The host imports its own tokens.css alongside:
 *
 *   import { createLab } from 'vue-design-lab'
 *   import './styles/tokens.css'
 *   createLab().mount('#app')
 */
export function createLab() {
  const app = createApp(App)
  app.use(router)
  return app
}

export { default as router } from './router'
export { default as App } from './App.vue'
