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
        <router-link to="/bookings" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span class="nav-label">Bookings</span>
        </router-link>

        <router-link to="/guests" class="nav-link">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span class="nav-label">Guests</span>
        </router-link>

        <router-link to="/settings" class="nav-link">
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
        </router-link>
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
  min-height: 100vh;
}

/* ---- Topbar (full-width, above everything) ---- */

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  z-index: 200;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.collapse-btn {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}

.collapse-btn:hover {
  background: var(--bg-base, #f5f7fa);
  color: #374151;
}

.collapse-btn:focus-visible {
  outline: 2px solid var(--color-teal, #2a9d8f);
  outline-offset: 2px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.brand-mark {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border: 1.5px solid rgba(42, 157, 143, 0.3);
  background: rgba(42, 157, 143, 0.06);
  color: var(--color-teal, #2a9d8f);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display, serif);
  font-size: 1rem;
}

.brand-name {
  font-family: var(--font-display, serif);
  font-size: 1.0625rem;
  font-weight: 400;
  color: #1a1a1a;
}

.topbar-right {
  display: flex;
  align-items: center;
}

/* ---- Sidebar (below topbar) ---- */

.sidebar {
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 220px;
  background: #1a2332;
  color: #c8d6e5;
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
  padding: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1.125rem;
  color: #c8d6e5;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  overflow: hidden;
  white-space: nowrap;
  border: none;
  outline: none;
  font-size: 0.9375rem;
}

.nav-link:hover {
  background: rgba(42, 157, 143, 0.12);
  color: #fff;
}

.nav-link:focus-visible {
  background: rgba(42, 157, 143, 0.12);
  color: #fff;
  box-shadow: inset 2px 0 0 var(--color-teal, #2a9d8f);
}

.nav-link.router-link-active {
  background: rgba(42, 157, 143, 0.2);
  color: var(--color-teal, #2a9d8f);
  box-shadow: inset 3px 0 0 var(--color-teal, #2a9d8f);
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
  gap: 0.75rem;
  padding: 0.75rem 1.125rem;
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  transition: background 0.15s ease;
  overflow: hidden;
}

.user-trigger:hover {
  background: rgba(255, 255, 255, 0.05);
}

.user-trigger:focus-visible {
  background: rgba(255, 255, 255, 0.08);
}

.collapsed .user-trigger {
  justify-content: center;
  padding: 0.75rem 0;
}

.user-avatar {
  width: 34px;
  height: 34px;
  min-width: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8899aa;
}

.user-avatar svg {
  width: 18px;
  height: 18px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
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
  font-size: 0.8125rem;
  font-weight: 500;
  color: #e2e8f0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.6875rem;
  color: #6b7d8e;
  letter-spacing: 0.01em;
}

/* ---- User dropdown menu ---- */

.user-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0.5rem;
  right: 0.5rem;
  background: #232f3e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.375rem;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
  z-index: 300;
}

.collapsed .user-menu {
  left: calc(100% + 6px);
  right: auto;
  bottom: 0;
  min-width: 180px;
}

.menu-item {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  font-size: 0.8125rem;
  color: #c8d6e5;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
  white-space: nowrap;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.menu-item:focus-visible {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.menu-item--danger:hover {
  background: rgba(229, 115, 115, 0.12);
  color: var(--color-red, #e57373);
}

.menu-item--danger:focus-visible {
  background: rgba(229, 115, 115, 0.12);
  color: var(--color-red, #e57373);
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
  min-height: calc(100vh - 56px);
  background: var(--bg-base, #f5f7fa);
  transition: margin-left 0.25s ease;
}

.collapsed .main-wrapper {
  margin-left: 60px;
}

.content {
  padding: 1.5rem 2rem;
}
</style>
