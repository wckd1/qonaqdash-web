import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useBreadcrumb } from '@/shared/composables/useBreadcrumb'
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
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { breadcrumb: [{ labelKey: 'nav.dashboard', path: null }] },
      },
      {
        path: 'manage/rooms',
        name: 'property',
        component: () => import('@/features/property/views/RoomsView.vue'),
        meta: { breadcrumb: [{ labelKey: 'nav.rooms', path: null }] },
      },
      {
        path: 'guests',
        name: 'guests',
        component: () => import('@/features/guests/views/GuestListView.vue'),
        meta: { breadcrumb: [{ labelKey: 'nav.guests', path: null }] },
      },
      {
        path: 'guests/new',
        name: 'guest-new',
        component: () => import('@/features/guests/views/GuestNewView.vue'),
        meta: {
          breadcrumb: [{ labelKey: 'nav.guests', path: '/guests' }, { labelKey: 'pageTitle.guestNew', path: null }],
        },
      },
      {
        path: 'guests/:id',
        name: 'guest-detail',
        component: () => import('@/features/guests/views/GuestDetailView.vue'),
        meta: {
          breadcrumb: [{ labelKey: 'nav.guests', path: '/guests' }, { labelKey: 'pageTitle.guest', path: null }],
        },
      },
      {
        path: 'bookings',
        name: 'bookings',
        component: () => import('@/features/bookings/views/BookingListView.vue'),
        meta: { breadcrumb: [{ labelKey: 'nav.bookings', path: null }] },
      },
      {
        path: 'bookings/new',
        name: 'booking-new',
        component: () => import('@/features/bookings/views/BookingFormView.vue'),
        meta: {
          breadcrumb: [
            { labelKey: 'nav.bookings', path: '/bookings' },
            { labelKey: 'pageTitle.bookingNew', path: null },
          ],
        },
      },
      {
        path: 'bookings/:id',
        name: 'booking-detail',
        component: () => import('@/features/bookings/views/BookingDetailView.vue'),
        meta: {
          breadcrumb: [
            { labelKey: 'nav.bookings', path: '/bookings' },
            { labelKey: 'pageTitle.booking', path: null },
          ],
        },
      },
      {
        path: 'manage/guests/form',
        name: 'manage-guests-form',
        component: () => import('@/features/guests/views/GuestFormSettingsView.vue'),
        meta: { breadcrumb: [{ labelKey: 'pageTitle.guestFormSettings', path: null }] },
      },
      {
        path: 'manage/bookings/form',
        name: 'manage-bookings-form',
        component: () => import('@/features/bookings/views/BookingFormSettingsView.vue'),
        meta: { breadcrumb: [{ labelKey: 'pageTitle.bookingFormSettings', path: null }] },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/shared/views/NotFoundView.vue'),
        meta: { breadcrumb: [] },
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

  const breadcrumb = to.matched.find((r) => r.meta.breadcrumb)?.meta?.breadcrumb
  if (breadcrumb !== undefined) {
    useBreadcrumb().setItems(breadcrumb)
  }
})

router.afterEach((to) => {
  applyDocumentTitleFromRoute(to)
})

export default router
