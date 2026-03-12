<template>
  <div class="app-layout" :class="{ collapsed: sidebarCollapsed }">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand">
          <span class="brand-mark">Q</span>
          <span class="brand-name">QonaqDash</span>
        </div>
      </div>

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

      <div class="sidebar-footer">
        <button class="sidebar-btn" @click="toggleSidebar" aria-label="Toggle sidebar">
          <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline :points="sidebarCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'" />
          </svg>
        </button>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-context">
          <span v-if="contextLabel" class="context-badge">{{ contextLabel }}</span>
        </div>
        <div class="topbar-actions">
          <button class="btn-logout" @click="logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span class="logout-label">Logout</span>
          </button>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useJwt } from '@/shared/composables/useJwt'

const router = useRouter()
const { getClaims } = useJwt()

const sidebarCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')

const contextLabel = computed(() => {
  const claims = getClaims()
  if (!claims) return ''
  return claims.hotelId || claims.orgId || ''
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar_collapsed', sidebarCollapsed.value)
}

function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  router.push({ name: 'login' })
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* ---- Sidebar ---- */

.sidebar {
  width: 240px;
  background: #1a2332;
  color: #c8d6e5;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: width 0.25s ease;
  overflow: hidden;
}

.collapsed .sidebar {
  width: 64px;
}

.sidebar-header {
  padding: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
  white-space: nowrap;
}

.brand-mark {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background: var(--color-teal, #2a9d8f);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
}

.brand-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #fff;
  transition: opacity 0.2s ease;
}

.collapsed .brand-name {
  opacity: 0;
  pointer-events: none;
}

/* ---- Navigation ---- */

.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  color: #c8d6e5;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  overflow: hidden;
  white-space: nowrap;
  border: none;
}

.nav-link:hover {
  background: rgba(42, 157, 143, 0.12);
  color: #fff;
}

.nav-link.router-link-active {
  background: rgba(42, 157, 143, 0.2);
  color: #2a9d8f;
  box-shadow: inset 3px 0 0 #2a9d8f;
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

/* ---- Sidebar footer ---- */

.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-btn {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: #c8d6e5;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.sidebar-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.toggle-icon {
  width: 20px;
  height: 20px;
}

/* ---- Main area ---- */

.main-wrapper {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.25s ease;
  background: var(--bg-cream, #faf8f5);
}

.collapsed .main-wrapper {
  margin-left: 64px;
}

.topbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--border-light, #e8e5e0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.context-badge {
  font-weight: 500;
  font-size: 0.9375rem;
  color: #374151;
}

.topbar-actions {
  display: flex;
  align-items: center;
}

.btn-logout {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--border-light, #e8e5e0);
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s ease;
}

.btn-logout:hover {
  background: #fef2f2;
  border-color: var(--color-red, #e57373);
  color: var(--color-red, #e57373);
}

.logout-label {
  line-height: 1;
}

.content {
  flex: 1;
  padding: 1.5rem 2rem;
}
</style>
