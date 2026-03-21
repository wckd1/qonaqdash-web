import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from '@/i18n'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import router from '@/router'
import App from '@/App.vue'

import '@picocss/pico/css/pico.min.css'
import '@/assets/main.css'

const app = createApp(App)
app.use(createPinia())
useSettingsStore()
app.use(i18n)
app.use(router)
app.mount('#app')
