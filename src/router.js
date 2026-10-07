import { createRouter, createWebHistory } from 'vue-router'

const LEGACY_TIMING_TECHNIQUES = ['transits', 'progressions', 'solar-return', 'profections', 'solar-arc', 'lunar-return']

const routes = [
  { path: '/',             component: () => import('./pages/HomePage.vue'),         name: 'home',         meta: { workspace: 'library' } },
  { path: '/person/:id',   component: () => import('./pages/PersonPage.vue'),       name: 'person',       meta: { workspace: 'library' } },
  { path: '/map/:lens?/:view?', component: () => import('./pages/MapPage.vue'),      name: 'map',          meta: { workspace: 'map' } },
  { path: '/natal',        component: () => import('./pages/NatalPage.vue'),        name: 'natal',        meta: { workspace: 'map', modality: 'astrology' } },
  { path: '/vedic',        component: () => import('./pages/VedicPage.vue'),        name: 'vedic',        meta: { workspace: 'map', modality: 'vedic' } },
  { path: '/human-design', component: () => import('./pages/HumanDesignPage.vue'),  name: 'human-design', meta: { workspace: 'map', modality: 'humanDesign' } },
  { path: '/report',       component: () => import('./pages/ReportPage.vue'),       name: 'report',       meta: { workspace: 'map', modality: 'astrology', mode: 'report' } },
  { path: '/timing/:technique?', component: () => import('./pages/TimingPage.vue'), name: 'timing',       meta: { workspace: 'timing' } },
  ...LEGACY_TIMING_TECHNIQUES.map(technique => ({
    path:     `/${technique}`,
    name:     technique,
    redirect: ({ query, hash }) => ({ name: 'timing', params: { technique }, query, hash }),
  })),
  { path: '/planetarium/:view?', component: () => import('./pages/PlanetariumPage.vue'), name: 'planetarium', meta: { workspace: 'planetarium', fullBleed: true } },
  { path: '/synastry',     component: () => import('./pages/SynastryPage.vue'),     name: 'synastry',     meta: { workspace: 'relations' } },
  { path: '/settings',     component: () => import('./pages/SettingsPage.vue'),     name: 'settings',     meta: { workspace: 'settings' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() { return { top: 0 } }
})

const GITHUB_PAGES_REDIRECT_KEY = 'astrelio.redirect'

const takeGitHubPagesRedirect = () => {
  if (typeof window === 'undefined') return ''

  const redirect = window.sessionStorage.getItem(GITHUB_PAGES_REDIRECT_KEY) || ''
  window.sessionStorage.removeItem(GITHUB_PAGES_REDIRECT_KEY)

  if (!redirect.startsWith('/') || redirect.startsWith('//')) return ''
  return redirect
}

router.beforeEach((to) => {
  if (to.path === '/' && typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
    return window.location.hash.slice(1)
  }

  const redirect = takeGitHubPagesRedirect()
  if (redirect && redirect !== to.fullPath) return redirect
  return true
})
