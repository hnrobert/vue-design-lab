import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * Auto routing for user materials under the HOST's src/pages/, in two shapes:
 *   - a single file:   src/pages/MyPoster.vue      -> /MyPoster
 *   - a folder:        src/pages/MyPoster/index.vue -> /MyPoster
 * Adding a material is dropping a file in (or creating one from the Templates
 * page, which writes real files there) - no registration anywhere.
 *
 * The leading-slash globs resolve against the Vite root, i.e. the host app -
 * this router ships inside the vue-design-lab package.
 *
 * The starter formats live in this package's src/templates/ and are NOT
 * routed; they only appear as previews on /templates.
 */
const singleModules = import.meta.glob('/src/pages/*.vue')
const dirModules = import.meta.glob('/src/pages/*/index.vue')

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
