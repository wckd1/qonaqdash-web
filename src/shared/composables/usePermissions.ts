import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import {
  canAccessBookingFolio,
  canAccessDashboard,
  canAccessEmployees,
  canAccessFormsOverview,
  canAccessGuests,
  canAccessHotelGeneral,
  canAccessPricingBaseRates,
  canAccessPricingRules,
  canAccessReports,
  canAccessRooms,
  canAdjustPricing,
  canBlockGuests,
  canCancelBookings,
  canCollectPayment,
  canCreateBookings,
  canCreateGuests,
  canCreateRooms,
  canManageBookingForms,
  canManageEmployeeForms,
  canManageEmployeePermissions,
  canManageEmployees,
  canManageGuestForms,
  canManageHotel,
  canManageOccupations,
  canManagePricing,
  canManageRooms,
  canModifyBilling,
  canModifyBookings,
  canModifyGuests,
  canOperateBookings,
  canRefundBilling,
  canViewBookings,
  resolveAccessibleHomeRoute,
} from '@/shared/lib/permissions'

export function usePermissions() {
  const authStore = useAuthStore()
  const settingsStore = useSettingsStore()
  const { permissions } = storeToRefs(settingsStore)

  const ctx = computed(() => ({
    permissions: permissions.value,
    hasHotelContext: !!authStore.hotelId,
  }))

  return {
    permissions,
    homeRouteName: computed(() => resolveAccessibleHomeRoute(ctx.value)),
    canAccessDashboard: computed(() => canAccessDashboard(ctx.value)),
    canAccessGuests: computed(() => canAccessGuests(ctx.value)),
    canCreateGuests: computed(() => canCreateGuests(ctx.value)),
    canModifyGuests: computed(() => canModifyGuests(ctx.value)),
    canBlockGuests: computed(() => canBlockGuests(ctx.value)),
    canViewBookings: computed(() => canViewBookings(ctx.value)),
    canCreateBookings: computed(() => canCreateBookings(ctx.value)),
    canModifyBookings: computed(() => canModifyBookings(ctx.value)),
    canOperateBookings: computed(() => canOperateBookings(ctx.value)),
    canCancelBookings: computed(() => canCancelBookings(ctx.value)),
    canAccessEmployees: computed(() => canAccessEmployees(ctx.value)),
    canManageEmployees: computed(() => canManageEmployees(ctx.value)),
    canAccessHotelGeneral: computed(() => canAccessHotelGeneral(ctx.value)),
    canManageHotel: computed(() => canManageHotel(ctx.value)),
    canAccessRooms: computed(() => canAccessRooms(ctx.value)),
    canCreateRooms: computed(() => canCreateRooms(ctx.value)),
    canManageRooms: computed(() => canManageRooms(ctx.value)),
    canManageOccupations: computed(() => canManageOccupations(ctx.value)),
    canManageEmployeePermissions: computed(() => canManageEmployeePermissions(ctx.value)),
    canAccessPricingBaseRates: computed(() => canAccessPricingBaseRates(ctx.value)),
    canAccessPricingRules: computed(() => canAccessPricingRules(ctx.value)),
    canAdjustPricing: computed(() => canAdjustPricing(ctx.value)),
    canManagePricing: computed(() => canManagePricing(ctx.value)),
    canAccessReports: computed(() => canAccessReports(ctx.value)),
    canAccessBookingFolio: computed(() => canAccessBookingFolio(ctx.value)),
    canCollectPayment: computed(() => canCollectPayment(ctx.value)),
    canModifyBilling: computed(() => canModifyBilling(ctx.value)),
    canRefundBilling: computed(() => canRefundBilling(ctx.value)),
    canAccessFormsOverview: computed(() => canAccessFormsOverview(ctx.value)),
    canManageGuestForms: computed(() => canManageGuestForms(ctx.value)),
    canManageBookingForms: computed(() => canManageBookingForms(ctx.value)),
    canManageEmployeeForms: computed(() => canManageEmployeeForms(ctx.value)),
  }
}
