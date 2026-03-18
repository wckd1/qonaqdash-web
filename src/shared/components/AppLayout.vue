<template>
  <div class="app-layout" :class="{ collapsed: sidebarCollapsed }">
    <header class="topbar">
      <div class="topbar-left">
        <button class="collapse-btn" @click="toggleSidebar" aria-label="Toggle sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </button>
        <div class="brand">
          <span class="brand-mark">Q</span>
          <span class="brand-name">QonaqDash</span>
        </div>
      </div>
      <div class="topbar-right"></div>
    </header>

    <aside class="sidebar">
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7l-9-6-9 6z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span class="nav-label">Dashboard</span>
        </router-link>

        <router-link to="/bookings" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span class="nav-label">Bookings</span>
        </router-link>

        <router-link
          to="/guests"
          class="nav-link"
          :class="{ 'nav-link--active': $route.path.startsWith('/guests') }"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span class="nav-label">Guests</span>
        </router-link>

        <div class="nav-group">
          <span class="nav-group-label">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <span class="nav-label">Settings</span>
          </span>
          <router-link to="/property" class="nav-link nav-sublink">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span class="nav-label">Rooms</span>
          </router-link>
        </div>
      </nav>

      <div ref="userAreaRef" class="sidebar-user">
        <button class="user-trigger" @click="toggleUserMenu">
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
            <span class="user-role">Administrator</span>
          </div>
        </button>

        <Transition name="menu">
          <div v-if="userMenuOpen" class="user-menu">
            <button class="menu-item" @click="handleProfile">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </button>
            <button class="menu-item menu-item--danger" @click="logout">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </div>
        </Transition>
      </div>
    </aside>

    <div class="main-wrapper">
      <div class="breadcrumb-row">
        <Breadcrumbs />
      </div>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import Breadcrumbs from '@/shared/components/Breadcrumbs.vue'

const router = useRouter()
const authStore = useAuthStore()
const userAreaRef = ref(null)

const sidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')
const userMenuOpen = ref(false)

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

<style scoped>
.app-layout {
  height: 100vh;
  overflow: hidden;
}

/* ---- Topbar ---- */

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--surface-1);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
  z-index: 200;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.collapse-btn {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--ink-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.collapse-btn:hover {
  background: var(--canvas);
  color: var(--ink-primary);
}

.collapse-btn:focus-visible {
  outline: var(--pico-outline-width) solid var(--brand-primary);
  outline-offset: var(--pico-outline-width);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.brand-mark {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border: var(--pico-border-width) solid rgba(42, 157, 143, 0.35);
  background: var(--semantic-info-bg);
  color: var(--brand-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1rem;
}

.brand-name {
  font-family: var(--font-display);
  font-size: var(--text-body-size);
  font-weight: var(--text-body-weight);
  color: var(--ink-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
}

/* ---- Sidebar (dark) ---- */

.sidebar {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 220px;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.25s ease;
}

.sidebar-nav,
.user-trigger {
  overflow: hidden;
}

.collapsed .sidebar {
  width: 60px;
}

/* ---- Navigation ---- */

.sidebar-nav {
  padding: var(--space-sm) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-micro);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  color: var(--sidebar-text);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  overflow: hidden;
  white-space: nowrap;
  border: none;
  outline: none;
  font-size: var(--text-body-size);
}

.nav-link:hover {
  background: var(--sidebar-hover-bg);
  color: var(--ink-inverse);
}

.nav-link:focus-visible {
  background: var(--sidebar-hover-bg);
  color: var(--ink-inverse);
  box-shadow: inset var(--pico-border-width) 0 0 var(--brand-primary);
}

.nav-link.router-link-exact-active,
.nav-link.nav-link--active {
  background: var(--sidebar-active-bg);
  color: var(--brand-primary);
  box-shadow: inset var(--radius-md) 0 0 var(--brand-primary);
}

.nav-icon {
  width: 20px;
  height: 20px;
  min-width: 20px;
  flex-shrink: 0;
}

.nav-label {
  transition: opacity 0.2s ease;
}

.collapsed .nav-label {
  opacity: 0;
  pointer-events: none;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-micro);
}

.nav-group-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
  color: var(--sidebar-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  overflow: hidden;
  white-space: nowrap;
}

.collapsed .nav-group-label {
  display: none;
}

.nav-sublink {
  padding-left: var(--space-lg);
}

.collapsed .nav-sublink {
  padding-left: var(--space-md);
}

/* ---- User area (sidebar bottom) ---- */

.sidebar-user {
  margin-top: auto;
  position: relative;
}

.user-trigger {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  border-top: 1px solid var(--sidebar-border);
  transition: background 0.15s ease;
  overflow: hidden;
}

.user-trigger:hover {
  background: var(--sidebar-hover-bg);
}

.user-trigger:focus-visible {
  background: var(--sidebar-active-bg);
}

.collapsed .user-trigger {
  justify-content: center;
  padding: var(--space-sm) 0;
}

.user-avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  background: var(--sidebar-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sidebar-text-muted);
}

.user-avatar svg {
  width: 18px;
  height: 18px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-micro);
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

.collapsed .user-info {
  opacity: 0;
  width: 0;
  pointer-events: none;
}

.user-name {
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--sidebar-text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: var(--text-caption-size);
  color: var(--sidebar-text-muted);
  letter-spacing: 0.01em;
}

/* ---- User dropdown menu (dark, matches sidebar) ---- */

.user-menu {
  position: absolute;
  bottom: calc(100% + var(--space-xs));
  left: var(--space-xs);
  right: var(--space-xs);
  background: var(--sidebar-user-menu-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: var(--radius-lg);
  padding: var(--space-micro);
  box-shadow: var(--shadow-lg);
  z-index: 300;
}

.collapsed .user-menu {
  left: calc(100% + var(--space-xs));
  right: auto;
  bottom: 0;
  min-width: 180px;
}

.menu-item {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-label-size);
  color: var(--sidebar-text);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
  white-space: nowrap;
}

.menu-item:hover {
  background: var(--sidebar-hover-bg);
  color: var(--ink-inverse);
}

.menu-item:focus-visible {
  background: var(--sidebar-active-bg);
  color: var(--ink-inverse);
}

.menu-item--danger:hover {
  background: var(--semantic-error-bg);
  color: var(--status-canceled);
}

.menu-item--danger:focus-visible {
  background: var(--semantic-error-bg);
  color: var(--status-canceled);
}

.menu-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Menu transition */

.menu-enter-active {
  transition: all 0.15s ease-out;
}

.menu-leave-active {
  transition: all 0.1s ease-in;
}

.menu-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.menu-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* ---- Main area ---- */

.main-wrapper {
  margin-left: 220px;
  margin-top: 56px;
  height: calc(100vh - 56px);
  padding: var(--space-sm);
  background: var(--canvas);
  transition: margin-left 0.25s ease;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 0;
}

.breadcrumb-row {
  flex-shrink: 0;
  margin-bottom: var(--space-micro);
  display: flex;
  justify-content: flex-start;
}

.breadcrumb-row :deep(.breadcrumbs) {
  margin: 0;
}

.collapsed .main-wrapper {
  margin-left: 60px;
}

.content {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-md);
  background: var(--surface-1);
  border-radius: var(--content-area-radius);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-subtle);
  box-sizing: border-box;
}
</style>
