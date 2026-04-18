import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import { applyDocumentTitleFromRoute } from '@/shared/i18n/documentTitle'
import {
  canAccessDashboard,
  canAccessEmployees,
  canAccessFormsOverview,
  canAccessGuests,
  canAccessHotelGeneral,
  canAccessPricingBaseRates,
  canAccessPricingRules,
  canAccessReports,
  canAccessRooms,
  canCreateBookings,
  canCreateGuests,
  canViewBookings,
  canManageBookingForms,
  canManageEmployeeForms,
  canManageEmployees,
  canManageGuestForms,
  canManageOccupations,
  resolveAccessibleHomeRoute,
} from '@/shared/lib/permissions'

function canAccessRoute(
  name: unknown,
  auth = useAuthStore(),
  settings = useSettingsStore(),
): boolean {
  const ctx = { permissions: settings.permissions, hasHotelContext: !!auth.hotelId }
  switch (name) {
    case 'dashboard':
      return canAccessDashboard(ctx)
    case 'manage-hotel':
      return canAccessHotelGeneral(ctx)
    case 'manage-hotel-occupations':
      return canManageOccupations(ctx)
    case 'rooms':
      return canAccessRooms(ctx)
    case 'guest-new':
      return canCreateGuests(ctx)
    case 'guest-detail':
    case 'guests':
      return canAccessGuests(ctx)
    case 'employee-new':
      return canManageEmployees(ctx)
    case 'employee-detail':
    case 'employees':
      return canAccessEmployees(ctx)
    case 'booking-new':
      return canCreateBookings(ctx)
    case 'booking-detail':
    case 'bookings':
      return canViewBookings(ctx)
    case 'manage-pricing-base-rates':
      return canAccessPricingBaseRates(ctx)
    case 'manage-pricing-rules':
      return canAccessPricingRules(ctx)
    case 'manage-reports':
      return canAccessReports(ctx)
    case 'manage-forms':
      return canAccessFormsOverview(ctx)
    case 'manage-guests-form':
      return canManageGuestForms(ctx)
    case 'manage-bookings-form':
      return canManageBookingForms(ctx)
    case 'manage-employees-form':
      return canManageEmployeeForms(ctx)
    case 'profile':
    case 'forbidden':
    case 'not-found':
      return true
    default:
      return true
  }
}

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
        path: 'manage/hotel',
        name: 'manage-hotel',
        component: () => import('@/features/property/views/HotelSettingsView.vue'),
      },
      {
        path: 'manage/hotel/occupations',
        name: 'manage-hotel-occupations',
        component: () => import('@/features/property/views/HotelOccupationsView.vue'),
      },
      {
        path: 'manage/rooms',
        name: 'rooms',
        component: () => import('@/features/property/views/RoomsView.vue'),
      },
      {
        path: 'guests/new',
        name: 'guest-new',
        component: () => import('@/features/guests/views/GuestNewView.vue'),
      },
      {
        path: 'guests/:id/details',
        name: 'guest-detail',
        component: () => import('@/features/guests/views/GuestDetailView.vue'),
      },
      {
        path: 'guests/:id?',
        name: 'guests',
        component: () => import('@/features/guests/views/GuestListView.vue'),
      },
      {
        path: 'employees/new',
        name: 'employee-new',
        component: () => import('@/features/employees/views/EmployeeNewView.vue'),
      },
      {
        path: 'employees/:id/details',
        name: 'employee-detail',
        component: () => import('@/features/employees/views/EmployeeDetailView.vue'),
      },
      {
        path: 'employees/:id?',
        name: 'employees',
        component: () => import('@/features/employees/views/EmployeeListView.vue'),
      },
      {
        path: 'bookings/new',
        name: 'booking-new',
        component: () => import('@/features/bookings/views/BookingNewView.vue'),
      },
      {
        path: 'bookings/:id/details',
        name: 'booking-detail',
        component: () => import('@/features/bookings/views/BookingDetailView.vue'),
      },
      {
        path: 'bookings/:id?',
        name: 'bookings',
        component: () => import('@/features/bookings/views/BookingListView.vue'),
      },
      {
        path: 'manage/pricing/base-rates',
        name: 'manage-pricing-base-rates',
        component: () => import('@/features/pricing/views/BaseRatesView.vue'),
      },
      {
        path: 'manage/pricing/rules',
        name: 'manage-pricing-rules',
        component: () => import('@/features/pricing/views/PricingRulesView.vue'),
      },
      {
        path: 'manage/reports',
        name: 'manage-reports',
        component: () => import('@/features/billing/views/ReportsView.vue'),
      },
      {
        path: 'manage/forms',
        name: 'manage-forms',
        component: () => import('@/shared/views/FormsOverviewView.vue'),
      },
      {
        path: 'manage/forms/guests',
        name: 'manage-guests-form',
        component: () => import('@/features/guests/views/GuestFormSettingsView.vue'),
      },
      {
        path: 'manage/forms/bookings',
        name: 'manage-bookings-form',
        component: () => import('@/features/bookings/views/BookingFormSettingsView.vue'),
      },
      {
        path: 'manage/forms/employees',
        name: 'manage-employees-form',
        component: () => import('@/features/employees/views/EmployeeFormSettingsView.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/features/auth/views/ProfileView.vue'),
      },
      {
        path: 'forbidden',
        name: 'forbidden',
        component: () => import('@/shared/views/ForbiddenView.vue'),
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
  const settings = useSettingsStore()

  if (!auth.isAuthenticated && auth.accessToken) {
    auth.logout()
  }

  if (to.matched.some((r) => r.meta.requiresAuth) && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (auth.isAuthenticated && !settings.permissionsLoaded) {
    return settings
      .fetchUserSettings()
      .catch(() => undefined)
      .then(() => {
        if (to.path.startsWith('/auth/')) return { path: '/' }
        if (to.name === 'dashboard' && !canAccessRoute('dashboard', auth, settings)) {
          return {
            name: resolveAccessibleHomeRoute({
              permissions: settings.permissions,
              hasHotelContext: !!auth.hotelId,
            }),
          }
        }
        if (to.name !== 'forbidden' && !canAccessRoute(to.name, auth, settings)) {
          return { name: 'forbidden', query: { from: to.fullPath } }
        }
        return true
      })
  }

  if (to.path.startsWith('/auth/') && auth.isAuthenticated) {
    return {
      name: resolveAccessibleHomeRoute({
        permissions: settings.permissions,
        hasHotelContext: !!auth.hotelId,
      }),
    }
  }

  if (to.name === 'dashboard' && !canAccessRoute('dashboard', auth, settings)) {
    return {
      name: resolveAccessibleHomeRoute({
        permissions: settings.permissions,
        hasHotelContext: !!auth.hotelId,
      }),
    }
  }

  if (to.name !== 'forbidden' && !canAccessRoute(to.name, auth, settings)) {
    return { name: 'forbidden', query: { from: to.fullPath } }
  }
})

router.afterEach((to) => {
  applyDocumentTitleFromRoute(to)
})

export default router
