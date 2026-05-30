import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',             component: () => import('./pages/HomePage.vue'),         name: 'home' },
  { path: '/person/:id',   component: () => import('./pages/PersonPage.vue'),       name: 'person' },
  { path: '/natal',        component: () => import('./pages/NatalPage.vue'),        name: 'natal' },
  { path: '/vedic',        component: () => import('./pages/VedicPage.vue'),        name: 'vedic' },
  { path: '/human-design', component: () => import('./pages/HumanDesignPage.vue'),  name: 'human-design' },
  { path: '/report',       component: () => import('./pages/ReportPage.vue'),       name: 'report' },
  { path: '/timing/:technique?', component: () => import('./pages/TimingPage.vue'), name: 'timing' },
  { path: '/transits',     component: () => import('./pages/TimingPage.vue'),       name: 'transits' },
  { path: '/progressions', component: () => import('./pages/TimingPage.vue'),       name: 'progressions' },
  { path: '/solar-return', component: () => import('./pages/TimingPage.vue'),       name: 'solar-return' },
  { path: '/profections',  component: () => import('./pages/TimingPage.vue'),       name: 'profections' },
  { path: '/solar-arc',    component: () => import('./pages/TimingPage.vue'),       name: 'solar-arc' },
  { path: '/lunar-return', component: () => import('./pages/TimingPage.vue'),       name: 'lunar-return' },
  { path: '/synastry',     component: () => import('./pages/SynastryPage.vue'),     name: 'synastry' },
  { path: '/settings',     component: () => import('./pages/SettingsPage.vue'),     name: 'settings' },
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
  const redirect = takeGitHubPagesRedirect()
  if (redirect && redirect !== to.fullPath) return redirect
  return true
})
