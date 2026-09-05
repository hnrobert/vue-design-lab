import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * Auto routing: every .vue under src/pages/ is a page, filename = route path.
 * Adding a material page is just dropping a file in, no registration.
 * (Page sizes are self-declared via data-export-w / data-export-h on each root
 * element, read by the export bar.)
 */
const pageModules = import.meta.glob('../pages/*.vue')

const autoRoutes: RouteRecordRaw[] = Object.entries(pageModules).map(([file, loader]) => {
  const name = /([\w-]+)\.vue$/.exec(file)![1]
  return {
    path: `/${name}`,
    name,
    component: loader as () => Promise<typeof import('*.vue')>,
  }
})

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    ...autoRoutes,
  ],
})
