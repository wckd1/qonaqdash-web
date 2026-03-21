<template>
  <router-view />
  <NotificationToast />
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import NotificationToast from '@/shared/components/NotificationToast.vue'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import router from '@/router'
import { applyDocumentTitleFromRoute } from '@/shared/i18n/documentTitle'

const settingsStore = useSettingsStore()
const { locale } = storeToRefs(settingsStore)

function applyDocumentLang(code) {
  document.documentElement.lang = code === 'ru' ? 'ru' : 'en'
}

onMounted(() => applyDocumentLang(locale.value))
watch(locale, (code) => {
  applyDocumentLang(code)
  applyDocumentTitleFromRoute(router.currentRoute.value)
})
</script>
