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
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import FormView from '@/shared/form-dsl/FormView.vue'
import { composeEntityFormFromTemplate } from '@/shared/form-dsl/normalizeFormResponse'
import { fetchEmployee } from '@/features/employees/api'
import type { EmployeeDetailData } from '@/features/employees/api'
import type { EmployeeSidePanelRef } from '@/features/employees/panelTypes'
import { useEmployeeStore } from '@/features/employees/stores/useEmployeeStore'
import { formatUnknownApiError } from '@/shared/i18n/apiError'
import { httpErrorResponse } from '@/shared/unknownError'

const { t } = useI18n()
const employeeStore = useEmployeeStore()
const { employeeFormTemplate, employeeFormRuntimeView } = storeToRefs(employeeStore)

const props = defineProps<{
  employee?: EmployeeSidePanelRef | null
}>()

const emit = defineEmits<{
  close: []
}>()

const detailEntity = ref<EmployeeDetailData | null>(null)
const loading = ref(false)
const loadError = ref('')
const notFound = ref(false)

let loadSeq = 0

const employeeForm = computed(() =>
  composeEntityFormFromTemplate(
    detailEntity.value ?? null,
    employeeFormRuntimeView.value ?? employeeFormTemplate.value,
  ),
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

watch(
  () => props.employee?.id,
  async (id) => {
    if (!id) {
      detailEntity.value = null
      loadError.value = ''
      notFound.value = false
      loading.value = false
      return
    }
    const seq = ++loadSeq
    loading.value = true
    loadError.value = ''
    notFound.value = false
    detailEntity.value = null
    try {
      const payload = await fetchEmployee(id)
      if (seq !== loadSeq) return
      detailEntity.value = payload.data
      await employeeStore.fetchEmployeeForm({
        target: 'view',
        definitionHash: payload.formRef?.hash ?? null,
        revalidate: true,
        ifNoneMatch: payload.formRef?.hash ?? null,
      })
      if (seq !== loadSeq) return
    } catch (err: unknown) {
      if (seq !== loadSeq) return
      if (httpErrorResponse(err)?.status === 404) {
        notFound.value = true
      } else {
        loadError.value = formatUnknownApiError(err) || t('employees.load_failed')
      }
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  },
  { immediate: true },
)
</script>
