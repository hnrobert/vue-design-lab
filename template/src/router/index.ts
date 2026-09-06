import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * Auto routing for user materials under src/pages/, in two shapes:
 *   - a single file:   src/pages/MyPoster.vue      -> /MyPoster
 *   - a folder:        src/pages/MyPoster/index.vue -> /MyPoster
 * Adding a material is dropping a file in (or creating one from the Templates
 * page, which writes real files here) - no registration anywhere.
 *
 * The starter formats live in src/templates/ and are NOT routed; they only
 * appear as previews on /templates.
 *
 * Page sizes are self-declared via data-export-w / data-export-h on each root
 * element, read by the export bar.
 */
const singleModules = import.meta.glob('../pages/*.vue')
const dirModules = import.meta.glob('../pages/*/index.vue')

function materialName(file: string): string | null {
  let m = /\/([\w-]+)\/index\.vue$/.exec(file)
  if (m) return m[1]
  m = /\/([\w-]+)\.vue$/.exec(file)
  return m && m[1] !== 'index' ? m[1] : null
}

const autoRoutes: RouteRecordRaw[] = []
for (const [file, loader] of [...Object.entries(singleModules), ...Object.entries(dirModules)]) {
  const name = materialName(file)
  if (!name) continue
  autoRoutes.push({
    path: `/${name}`,
    name,
    component: loader as () => Promise<typeof import('*.vue')>,
  })
}
// Sort alphabetically so the nav and home grid read as a size catalog
autoRoutes.sort((a, b) => String(a.path).localeCompare(String(b.path)))

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/templates',
      name: 'Templates',
      component: () => import('../views/Templates.vue'),
    },
    ...autoRoutes,
  ],
})
