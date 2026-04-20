<template>
  <header class="page-header">
    <h1>{{ t('nav.employees') }}</h1>
    <router-link v-if="canManageEmployees" :to="{ name: 'employee-new' }" class="btn-add-outline">
      <svg
        class="btn-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {{ t('employees.new_employee') }}
    </router-link>
  </header>

  <SearchBar
    v-model="searchQuery"
    :placeholder="t('employees.search_placeholder')"
    :aria-label="t('employees.search_aria')"
    :searching="searching"
  />

  <section class="list-content">
    <div class="list-content__viewport">
      <p v-if="loadError" class="error-message">{{ loadError }}</p>
      <div v-else-if="initialLoading" class="loading-state">{{ t('common.loading') }}</div>
      <template v-else>
        <div v-if="!employees.length && !searchQuery" class="empty-state-widget">
          <div class="empty-state-widget__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 class="empty-state-widget__title">{{ t('employees.empty_title') }}</h3>
          <p class="empty-state-widget__description">{{ t('employees.empty_description') }}</p>
          <div class="empty-state-widget__actions">
            <router-link
              v-if="canManageEmployees"
              :to="{ name: 'employee-new' }"
              class="primary"
              role="button"
            >
              {{ t('employees.new_employee') }}
            </router-link>
          </div>
        </div>
        <p v-else-if="!employees.length && searchQuery" class="empty-state">
          {{ t('employees.empty_search') }}
        </p>
        <table v-else class="list-table" role="grid">
          <thead>
            <tr>
              <th scope="col">{{ t('fields.first_name') }}</th>
              <th scope="col">{{ t('fields.last_name') }}</th>
              <th scope="col">{{ t('fields.email') }}</th>
              <th scope="col" class="list-table__col--actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="employee in employees"
              :key="employee.id"
              class="list-row"
              :class="{ 'list-row--selected': selectedEmployeeId === employee.id }"
              @click="openPanel(employee)"
            >
              <td :data-label="t('fields.first_name')">{{ employee.first_name ?? '—' }}</td>
              <td :data-label="t('fields.last_name')">{{ employee.last_name ?? '—' }}</td>
              <td :data-label="t('fields.email')">{{ employee.email ?? '—' }}</td>
              <td class="list-table__cell--actions">
                <router-link
                  :to="{ name: 'employee-detail', params: { id: employee.id } }"
                  class="list-table__action"
                  @click.stop
                >
                  {{ t('common.details') }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
    <EmployeeSidePanel :employee="selectedEmployee" @close="closePanel" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import EmployeeSidePanel from '@/features/employees/components/EmployeeSidePanel.vue'
import { useEmployeeStore } from '@/features/employees/stores/useEmployeeStore'
import type { EmployeeListItem } from '@/features/employees/api'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import SearchBar from '@/shared/components/SearchBar.vue'
import { usePermissions } from '@/shared/composables/usePermissions'

const DEBOUNCE_MS = 300
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useEmployeeStore()
const { canManageEmployees } = usePermissions()
const { employees } = storeToRefs(store)

const initialLoading = ref(true)
const searching = ref(false)
const loadError = ref('')
const searchQuery = ref('')
let searchDebounceId: ReturnType<typeof setTimeout> | null = null

const selectedEmployeeId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id ? id : null
})

const selectedEmployee = computed(() => {
  const id = selectedEmployeeId.value
  if (!id) return null
  return employees.value.find((row) => row.id === id) ?? { id }
})

function openPanel(employee: EmployeeListItem) {
  const id = employee.id
  if (route.params.id) {
    router.replace({ name: 'employees', params: { id } })
  } else {
    router.push({ name: 'employees', params: { id } })
  }
}

function closePanel() {
  router.push({ name: 'employees' })
}

async function load(params: { search?: string } = {}, isInitial = false) {
  loadError.value = ''
  if (isInitial) {
    initialLoading.value = true
  } else {
    searching.value = true
  }
  try {
    await store.fetchEmployees(params)
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('employees.load_failed')
  } finally {
    initialLoading.value = false
    searching.value = false
  }
}

watch(searchQuery, (value) => {
  if (searchDebounceId) clearTimeout(searchDebounceId)
  searchDebounceId = setTimeout(() => {
    searchDebounceId = null
    load(value ? { search: value } : {})
  }, DEBOUNCE_MS)
})

onMounted(() => load({}, true))
</script>
