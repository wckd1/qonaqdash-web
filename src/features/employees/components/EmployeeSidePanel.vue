<template>
  <Transition name="slide-panel">
    <aside v-if="employee" class="side-panel" aria-labelledby="side-panel-title">
      <div class="side-panel-header">
        <h2 id="side-panel-title">{{ employeePanelTitle }}</h2>
        <button
          type="button"
          class="side-panel-close"
          :aria-label="t('common.close_panel')"
          @click="emit('close')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="side-panel-body">
        <p v-if="loadError" class="error-message">{{ loadError }}</p>
        <p v-else-if="notFound" class="error-message">{{ t('employees.not_found') }}</p>
        <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
        <FormView
          v-else-if="employeeForm"
          compact
          :definition="employeeForm.definition"
          :data="employeeForm.data"
        />
        <p v-else class="section-placeholder">{{ t('employees.details_loading') }}</p>
      </div>
      <div class="side-panel-footer">
        <router-link
          :to="{ name: 'employee-detail', params: { id: employee.id } }"
          class="btn-open-full-page"
        >
          {{ t('common.open_full_page') }}
        </router-link>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@pinia/colada'
import FormView from '@/shared/form-dsl/FormView.vue'
import { composeEntityFormFromTemplate } from '@/shared/form-dsl/normalizeFormResponse'
import { employeeDetailQuery, employeeRuntimeFormQuery } from '@/features/employees/queries'
import type { EmployeeSidePanelRef } from '@/features/employees/panelTypes'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorResponse } from '@/shared/unknownError'

const { t } = useI18n()

const props = defineProps<{
  employee?: EmployeeSidePanelRef | null
}>()

const emit = defineEmits<{
  close: []
}>()

const employeeId = computed(() => props.employee?.id ?? '')
const detailQ = useQuery(() => ({
  ...employeeDetailQuery(employeeId.value),
  enabled: !!employeeId.value,
}))
const formHash = computed(() => detailQ.data.value?.formRef?.hash ?? '')
const formQ = useQuery(() => ({
  ...employeeRuntimeFormQuery({ target: 'view', hash: formHash.value }),
  enabled: !!detailQ.data.value,
}))

const detailEntity = computed(() => (employeeId.value ? (detailQ.data.value?.data ?? null) : null))
const loading = computed(
  () =>
    !!employeeId.value &&
    (detailQ.isPending.value || (!!detailEntity.value && formQ.isPending.value)),
)
const notFound = computed(() => httpErrorResponse(detailQ.error.value)?.status === 404)
const loadError = computed(() => {
  const err = (notFound.value ? null : detailQ.error.value) ?? formQ.error.value
  return err ? formatUnknownApiError(err) || t('employees.load_failed') : ''
})

const employeeForm = computed(() =>
  composeEntityFormFromTemplate(detailEntity.value ?? null, formQ.data.value ?? null),
)

const employeePanelTitle = computed(() => {
  const entity = detailEntity.value
  if (entity) {
    const first = typeof entity.first_name === 'string' ? entity.first_name : ''
    const last = typeof entity.last_name === 'string' ? entity.last_name : ''
    const parts = [first, last].filter(Boolean)
    if (parts.length) return parts.join(' ')
    if (typeof entity.email === 'string' && entity.email) return entity.email
  }
  const row = props.employee
  if (!row) return ''
  const first = 'first_name' in row && typeof row.first_name === 'string' ? row.first_name : ''
  const last = 'last_name' in row && typeof row.last_name === 'string' ? row.last_name : ''
  return [first, last].filter(Boolean).join(' ') || t('page_title.employee')
})
</script>
