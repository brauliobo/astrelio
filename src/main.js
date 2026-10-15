import { createVaporApp, vaporInteropPlugin } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router.js'
import { i18n } from './i18n/index.js'
import './styles/main.css'

const UPDATE_CHECK_MS = 10 * 60 * 1000

// autoUpdate activates and reloads on a new worker, but the browser only looks for one on navigation.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    const check = () => navigator.onLine && registration.update()
    setInterval(check, UPDATE_CHECK_MS)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
  },
})

const pinia = createPinia()
pinia.use(piniaPersist)

createVaporApp(App)
  .use(vaporInteropPlugin)
  .use(pinia)
  .use(router)
  .use(i18n)
  .mount('#app')
