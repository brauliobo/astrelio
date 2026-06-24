import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import { router } from './router.js'
import { i18n } from './i18n/index.js'
import './styles/main.css'

registerSW({ immediate: true })

const pinia = createPinia()
pinia.use(piniaPersist)

createApp(App)
  .use(pinia)
  .use(router)
  .use(i18n)
  .mount('#app')
