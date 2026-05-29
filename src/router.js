import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/',             component: () => import('./pages/HomePage.vue'),         name: 'home' },
  { path: '/natal',        component: () => import('./pages/NatalPage.vue'),        name: 'natal' },
  { path: '/report',       component: () => import('./pages/ReportPage.vue'),       name: 'report' },
  { path: '/transits',     component: () => import('./pages/TransitsPage.vue'),     name: 'transits' },
  { path: '/progressions', component: () => import('./pages/ProgressionsPage.vue'), name: 'progressions' },
  { path: '/solar-return', component: () => import('./pages/SolarReturnPage.vue'),  name: 'solar-return' },
  { path: '/synastry',     component: () => import('./pages/SynastryPage.vue'),     name: 'synastry' },
  { path: '/settings',     component: () => import('./pages/SettingsPage.vue'),     name: 'settings' },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})
