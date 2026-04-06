<template>
  <div class="app-layout" :class="{ collapsed: sidebarCollapsed }">
    <header class="topbar">
      <div class="topbar-left">
        <button
          class="collapse-btn"
          type="button"
          :aria-label="t('layout.toggle_sidebar')"
          @click="toggleSidebar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            width="20"
            height="20"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </button>
        <router-link to="/" class="brand-link" :aria-label="t('layout.brand_home')">
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
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
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
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span class="nav-label">{{ t('nav.guests') }}</span>
          </router-link>

          <router-link
            to="/employees"
            class="nav-link"
            :class="{ 'nav-link--active': $route.path.startsWith('/employees') }"
          >
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 3h6" />
              <path d="M10 3v3" />
              <path d="M14 3v3" />
              <rect x="5" y="6" width="14" height="15" rx="2" />
              <circle cx="12" cy="11" r="2.5" />
              <path d="M8.5 18a4.5 4.5 0 0 1 7 0" />
            </svg>
            <span class="nav-label">{{ t('nav.employees') }}</span>
          </router-link>

          <details
            class="nav-group"
            :open="sidebarCollapsed || manageNavOpen"
            @toggle="onManageNavToggle"
          >
            <summary
              class="nav-group-trigger"
              :aria-label="
                manageNavOpen ? t('layout.collapse_management') : t('layout.expand_management')
              "
              aria-controls="sidebar-manage-items"
            >
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
              <span class="nav-label">{{ t('nav.management') }}</span>
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
            <div id="sidebar-manage-items" class="nav-group__items">
              <router-link
                to="/manage/hotel"
                class="nav-link nav-sublink"
                :class="{
                  'nav-link--active':
                    $route.path === '/manage/hotel' || $route.path === '/manage/rooms',
                }"
              >
                <svg
                  class="nav-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                  <path d="M6 12h4v10H6z" />
                  <path d="M14 12h4v10h-4z" />
                  <path d="M6 12V8h12v4" />
                </svg>
                <span class="nav-label">{{ t('nav.hotel') }}</span>
              </router-link>
              <router-link
                to="/manage/pricing/rules"
                class="nav-link nav-sublink"
                :class="{ 'nav-link--active': $route.path.startsWith('/manage/pricing') }"
              >
                <svg
                  class="nav-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
                  />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span class="nav-label">{{ t('nav.pricing') }}</span>
              </router-link>
              <router-link
                to="/manage/forms"
                class="nav-link nav-sublink"
                :class="{
                  'nav-link--active': $route.path.startsWith('/manage/forms'),
                }"
              >
                <svg
                  class="nav-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span class="nav-label">{{ t('nav.forms') }}</span>
              </router-link>
              <router-link
                to="/manage/reports"
                class="nav-link nav-sublink"
                :class="{ 'nav-link--active': $route.path === '/manage/reports' }"
              >
                <svg
                  class="nav-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                <span class="nav-label">{{ t('nav.reports') }}</span>
              </router-link>
            </div>
          </details>
        </nav>

        <div ref="userAreaRef" class="sidebar-user">
          <button type="button" class="user-trigger" @click="toggleUserMenu">
            <div class="user-avatar">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div class="user-info">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ userContextLabel }}</span>
            </div>
          </button>

          <Transition name="menu">
            <div v-if="userMenuOpen" class="user-menu">
              <button type="button" class="menu-item" @click="handleProfile">
                <svg
                  class="menu-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {{ t('layout.profile') }}
              </button>
              <button type="button" class="menu-item menu-item--danger" @click="logout">
                <svg
                  class="menu-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
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

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import { usePropertyStore } from '@/features/property/stores/usePropertyStore'
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const propertyStore = usePropertyStore()
const { accountEmail } = storeToRefs(settingsStore)
const { hotel } = storeToRefs(propertyStore)

/**
 * Short form / settings pages: main height fits content (no tall empty column).
 * Full guest/booking detail uses fill height + inner scroll (e.g. `.guest-detail-body`).
 */
const isFormPage = computed(() => {
  const p = route.path
  return (
    p === '/guests/new' ||
    p === '/employees/new' ||
    p.startsWith('/manage/forms') ||
    p === '/manage/hotel' ||
    p.startsWith('/manage/pricing') ||
    p === '/profile'
  )
})
const userAreaRef = ref<HTMLElement | null>(null)

const sidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')
const userMenuOpen = ref(false)
/** Management subnav: closed by default; opens when visiting /manage/* or user toggles. */
const manageNavOpen = ref(false)

function onManageNavToggle(e) {
  const el = e.target
  if (!(el instanceof HTMLDetailsElement)) return
  if (sidebarCollapsed.value) {
    el.open = true
    return
  }
  manageNavOpen.value = el.open
}

watch(
  () => route.path,
  (p, oldP) => {
    if (oldP === undefined) {
      if (p.startsWith('/manage/')) manageNavOpen.value = true
      return
    }
    if (p.startsWith('/manage/') && !oldP.startsWith('/manage/')) {
      manageNavOpen.value = true
    }
  },
  { immediate: true },
)

const userName = computed(() => {
  const first = settingsStore.profileFirstName?.trim?.() ?? ''
  const last = settingsStore.profileLastName?.trim?.() ?? ''
  const fullName = [first, last].filter(Boolean).join(' ')
  if (fullName) return fullName
  return accountEmail.value || authStore.user?.email || 'User'
})

const userContextLabel = computed(() => {
  if (hotel.value?.name) return hotel.value.name
  if (authStore.employeeId) return t('layout.employee_id', { id: authStore.employeeId })
  return t('layout.administrator')
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed.value))
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target
  if (
    userMenuOpen.value &&
    userAreaRef.value &&
    target instanceof Node &&
    !userAreaRef.value.contains(target)
  ) {
    userMenuOpen.value = false
  }
}

function handleProfile() {
  userMenuOpen.value = false
  router.push({ name: 'profile' })
}

function logout() {
  userMenuOpen.value = false
  authStore.logout()
  router.push({ name: 'login' })
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

watch(
  () => authStore.hotelId,
  (hotelId) => {
    if (!hotelId) return
    void propertyStore.fetchHotel().catch(() => {})
  },
  { immediate: true },
)
</script>
