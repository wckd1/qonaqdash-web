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
  home: 'pageTitle.dashboard',
  property: 'pageTitle.rooms',
  guests: 'pageTitle.guests',
  'guest-new': 'pageTitle.guestNew',
  'guest-detail': 'pageTitle.guest',
  bookings: 'pageTitle.bookings',
  'booking-new': 'pageTitle.bookingNew',
  'booking-detail': 'pageTitle.booking',
  'manage-guests-form': 'pageTitle.guestFormSettings',
  'manage-bookings-form': 'pageTitle.bookingFormSettings',
  'not-found': 'pageTitle.notFound',
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
    document.title = formatDocumentTitle(i18n.global.t('pageTitle.login'))
    return
  }
  if (name === 'invite') {
    document.title = formatDocumentTitle(i18n.global.t('pageTitle.invite'))
    return
  }

  const key = ROUTE_TITLE_KEYS[name]
  if (key) {
    document.title = formatDocumentTitle(i18n.global.t(key))
    return
  }

  document.title = APP_NAME
}
