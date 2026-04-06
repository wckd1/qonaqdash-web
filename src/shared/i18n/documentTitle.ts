import { i18n } from '@/i18n'

export const APP_NAME = 'QonaqDash'

/**
 * Browser tab title: "{page} · QonaqDash". Empty page part yields app name only.
 * @param {string} pagePart
 * @returns {string}
 */
export function formatDocumentTitle(pagePart) {
  const part = typeof pagePart === 'string' ? pagePart.trim() : ''
  if (!part) return APP_NAME
  return `${part} · ${APP_NAME}`
}

/** @type {Record<string, string>} */
const ROUTE_TITLE_KEYS = {
  dashboard: 'page_title.dashboard',
  'manage-hotel': 'page_title.hotel',
  rooms: 'page_title.hotel',
  employees: 'page_title.employees',
  'employee-new': 'page_title.employee_new',
  'employee-detail': 'page_title.employee',
  guests: 'page_title.guests',
  'guest-new': 'page_title.guest_new',
  'guest-detail': 'page_title.guest',
  bookings: 'page_title.bookings',
  'booking-new': 'page_title.booking_new',
  'booking-detail': 'page_title.booking',
  'manage-pricing-base-rates': 'page_title.pricing_base_rates',
  'manage-pricing-rules': 'page_title.pricing_rules',
  'manage-reports': 'page_title.reports',
  'manage-forms': 'page_title.forms',
  'manage-guests-form': 'page_title.guest_form_settings',
  'manage-bookings-form': 'page_title.booking_form_settings',
  'manage-employees-form': 'page_title.employee_form_settings',
  profile: 'page_title.profile',
  'not-found': 'page_title.not_found',
}

/**
 * Set document.title from route (static routes). Detail routes use a provisional title until views refine it.
 * @param {import('vue-router').RouteLocationNormalizedLoaded} route
 */
export function applyDocumentTitleFromRoute(route) {
  const name = route.name
  if (typeof name !== 'string') {
    document.title = APP_NAME
    return
  }

  if (name === 'login') {
    document.title = formatDocumentTitle(i18n.global.t('page_title.login'))
    return
  }
  if (name === 'invite') {
    document.title = formatDocumentTitle(i18n.global.t('page_title.invite'))
    return
  }

  const key = ROUTE_TITLE_KEYS[name]
  if (key) {
    document.title = formatDocumentTitle(i18n.global.t(key))
    return
  }

  document.title = APP_NAME
}
