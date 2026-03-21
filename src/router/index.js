import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { applyDocumentTitleFromRoute } from '@/shared/i18n/documentTitle'

const routes = [
  {
    path: '/auth/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue'),
  },
  {
    path: '/auth/invite/:token',
    name: 'invite',
    component: () => import('@/features/auth/views/InviteView.vue'),
  },
  {
    path: '/',
    component: () => import('@/shared/components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/features/dashboard/views/DashboardView.vue'),
      },
      {
        path: 'manage/rooms',
        name: 'property',
        component: () => import('@/features/property/views/RoomsView.vue'),
      },
      {
        path: 'guests',
        name: 'guests',
        component: () => import('@/features/guests/views/GuestListView.vue'),
      },
      {
        path: 'guests/new',
        name: 'guest-new',
        component: () => import('@/features/guests/views/GuestNewView.vue'),
      },
      {
        path: 'guests/:id',
        name: 'guest-detail',
        component: () => import('@/features/guests/views/GuestDetailView.vue'),
      },
      {
        path: 'bookings',
        name: 'bookings',
        component: () => import('@/features/bookings/views/BookingListView.vue'),
      },
      {
        path: 'bookings/new',
        name: 'booking-new',
        component: () => import('@/features/bookings/views/BookingFormView.vue'),
      },
      {
        path: 'bookings/:id',
        name: 'booking-detail',
        component: () => import('@/features/bookings/views/BookingDetailView.vue'),
      },
      {
        path: 'manage/guests/form',
        name: 'manage-guests-form',
        component: () => import('@/features/guests/views/GuestFormSettingsView.vue'),
      },
      {
        path: 'manage/bookings/form',
        name: 'manage-bookings-form',
        component: () => import('@/features/bookings/views/BookingFormSettingsView.vue'),
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/shared/views/NotFoundView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (!auth.isAuthenticated && auth.accessToken) {
    auth.logout()
  }

  if (to.matched.some((r) => r.meta.requiresAuth) && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.path.startsWith('/auth/') && auth.isAuthenticated) {
    return { path: '/' }
  }
})

router.afterEach((to) => {
  applyDocumentTitleFromRoute(to)
})

export default router
