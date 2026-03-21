<template>
  <div class="app-layout" :class="{ collapsed: sidebarCollapsed }">
    <header class="topbar">
      <div class="topbar-left">
        <button class="collapse-btn" type="button" @click="toggleSidebar" :aria-label="t('layout.toggleSidebar')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </button>
        <router-link to="/" class="brand-link" :aria-label="t('layout.brandHome')">
          <span class="brand-mark" aria-hidden="true">Q</span>
          <span class="brand-name">QonaqDash</span>
        </router-link>
      </div>
    </header>

    <div class="app-layout-body">
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-link">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
          <span class="nav-label">{{ t('nav.dashboard') }}</span>
        </router-link>

        <router-link
          to="/bookings"
          class="nav-link"
          :class="{
            'nav-link--active':
              $route.path.startsWith('/bookings') && !$route.path.startsWith('/manage/bookings'),
          }"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span class="nav-label">{{ t('nav.bookings') }}</span>
        </router-link>

        <router-link
          to="/guests"
          class="nav-link"
          :class="{
            'nav-link--active':
              $route.path.startsWith('/guests') && !$route.path.startsWith('/manage/guests'),
          }"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span class="nav-label">{{ t('nav.guests') }}</span>
        </router-link>

        <details
          class="nav-group"
          :open="sidebarCollapsed || settingsNavOpen"
          @toggle="onSettingsNavToggle"
        >
          <summary
            class="nav-group-trigger"
            :aria-label="settingsNavOpen ? t('layout.collapseSettings') : t('layout.expandSettings')"
            aria-controls="sidebar-settings-items"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span class="nav-label">{{ t('nav.settings') }}</span>
            <svg
              class="nav-group-chevron"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div id="sidebar-settings-items" class="nav-group__items">
            <router-link
              to="/manage/rooms"
              class="nav-link nav-sublink"
              :class="{ 'nav-link--active': $route.path === '/manage/rooms' }"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span class="nav-label">{{ t('nav.rooms') }}</span>
            </router-link>
            <router-link
              to="/manage/guests/form"
              class="nav-link nav-sublink"
              :class="{ 'nav-link--active': $route.path.startsWith('/manage/guests') }"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span class="nav-label">{{ t('nav.guestForm') }}</span>
            </router-link>
            <router-link
              to="/manage/bookings/form"
              class="nav-link nav-sublink"
              :class="{ 'nav-link--active': $route.path.startsWith('/manage/bookings') }"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span class="nav-label">{{ t('nav.bookingForm') }}</span>
            </router-link>
          </div>
        </details>
      </nav>

      <div ref="userAreaRef" class="sidebar-user">
        <button type="button" class="user-trigger" @click="toggleUserMenu">
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">{{ t('layout.administrator') }}</span>
          </div>
        </button>

        <Transition name="menu">
          <div v-if="userMenuOpen" class="user-menu">
            <button type="button" class="menu-item" @click="handleProfile">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {{ t('layout.profile') }}
            </button>
            <button type="button" class="menu-item menu-item--danger" @click="logout">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {{ t('layout.logout') }}
            </button>
          </div>
        </Transition>
      </div>
    </aside>

    <main class="app-main" :class="{ 'app-main--fit-content': isFormPage }">
      <router-view />
    </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

/** Form/detail pages: main content height fits content instead of filling available space. */
const isFormPage = computed(() => {
  const p = route.path
  return (
    p === '/guests/new' ||
    p === '/bookings/new' ||
    p === '/manage/guests/form' ||
    p === '/manage/bookings/form' ||
    /^\/guests\/[^/]+$/.test(p) ||
    /^\/bookings\/[^/]+$/.test(p)
  )
})
const userAreaRef = ref(null)

const sidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')
const userMenuOpen = ref(false)
/** Settings subnav: closed by default; opens when visiting /manage/* or user toggles. */
const settingsNavOpen = ref(false)

function onSettingsNavToggle(e) {
  const el = e.target
  if (!(el instanceof HTMLDetailsElement)) return
  if (sidebarCollapsed.value) {
    el.open = true
    return
  }
  settingsNavOpen.value = el.open
}

watch(
  () => route.path,
  (p, oldP) => {
    if (oldP === undefined) {
      if (p.startsWith('/manage/')) settingsNavOpen.value = true
      return
    }
    if (p.startsWith('/manage/') && !oldP.startsWith('/manage/')) {
      settingsNavOpen.value = true
    }
  },
  { immediate: true },
)

const userName = computed(() => {
  return authStore.user?.email || 'User'
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar_collapsed', sidebarCollapsed.value)
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function handleClickOutside(e) {
  if (userMenuOpen.value && userAreaRef.value && !userAreaRef.value.contains(e.target)) {
    userMenuOpen.value = false
  }
}

function handleProfile() {
  userMenuOpen.value = false
}

function logout() {
  userMenuOpen.value = false
  authStore.logout()
  router.push({ name: 'login' })
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
