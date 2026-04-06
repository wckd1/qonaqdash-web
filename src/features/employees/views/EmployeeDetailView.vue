<template>
  <header class="page-header">
    <h1>{{ employeeDisplayName }}</h1>
    <div v-if="employeeId && employeeForm && !editing" class="page-header-actions">
      <button type="button" class="btn-secondary" @click="editing = true">
        {{ t('common.edit') }}
      </button>
    </div>
    <div v-else-if="employeeId && employeeForm && editing" class="page-header-actions">
      <button type="button" :disabled="submitting" @click="onSave">
        {{ submitting ? t('common.saving') : t('common.save') }}
      </button>
      <button type="button" class="btn-secondary" :disabled="submitting" @click="cancelEdit">
        {{ t('common.cancel') }}
      </button>
    </div>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <p v-else-if="notFound" class="error-message">
    {{ t('employees.not_found') }}
    <router-link :to="{ name: 'employees' }" class="inline-link">
      {{ t('employees.back_to_list') }}
    </router-link>
  </p>
  <template v-else-if="currentEmployee">
    <div class="employee-detail-body">
      <div class="employee-detail-form">
        <template v-if="employeeForm">
          <FormView
            v-if="!editing"
            :definition="employeeForm.definition"
            :data="employeeForm.data"
          />
          <template v-else>
            <FormEdit
              :definition="employeeForm.definition"
              :data="editFormData"
              :errors-map="errorsMap"
              @update:data="editFormData = $event"
            />
          </template>
        </template>
        <p v-else class="section-placeholder">{{ t('employees.details_loading') }}</p>
      </div>
    </div>
  </template>
  <div v-else class="loading-state">{{ t('common.loading') }}</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDocumentTitle } from '@/shared/i18n/documentTitle'
import { useEmployeeStore } from '@/features/employees/stores/useEmployeeStore'
import FormView from '@/shared/form-dsl/FormView.vue'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import { composeEntityFormFromTemplate } from '@/shared/form-dsl/normalizeFormResponse'
import { formatUnknownApiError, formErrorsMapFromHttpError } from '@/shared/i18n/apiError'
import { httpErrorResponse } from '@/shared/unknownError'
import { validateFormData } from '@/shared/form-dsl/validateFormData'
import { scrollToFirstFormError } from '@/shared/form-dsl/scrollToFirstError'
import { useNotification } from '@/shared/composables/useNotification'

const { t, locale } = useI18n()
const route = useRoute()
const store = useEmployeeStore()
const { success } = useNotification()
const { currentEmployee, currentEmployeeFormRef, employeeFormTemplate, employeeFormRuntimeView } =
  storeToRefs(store)

const loadError = ref('')
const notFound = ref(false)
const editing = ref(false)
const editFormData = ref<Record<string, unknown>>({})
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)

function routeEmployeeId(): string | null {
  const id = route.params.id
  if (typeof id === 'string' && id) return id
  if (Array.isArray(id) && id[0]) return id[0]
  return null
}

const employeeId = computed(() => routeEmployeeId())

const employeeForm = computed(() =>
  composeEntityFormFromTemplate(
    currentEmployee.value ?? null,
    employeeFormRuntimeView.value ?? employeeFormTemplate.value,
  ),
)

const employeeDisplayName = computed(() => {
  void locale.value
  const employee = currentEmployee.value
  if (!employee) return t('page_title.employee')
  const first = typeof employee.first_name === 'string' ? employee.first_name : ''
  const last = typeof employee.last_name === 'string' ? employee.last_name : ''
  const parts = [first, last].filter(Boolean)
  if (parts.length) return parts.join(' ')
  if (typeof employee.email === 'string' && employee.email) return employee.email
  return t('page_title.employee')
})

async function load() {
  const id = routeEmployeeId()
  if (!id) return
  store.clearCurrentEmployee()
  loadError.value = ''
  notFound.value = false
  try {
    await store.fetchEmployee(id)
    await store.fetchEmployeeForm({
      target: 'view',
      definitionHash: currentEmployeeFormRef.value?.hash ?? null,
      revalidate: true,
      ifNoneMatch: currentEmployeeFormRef.value?.hash ?? null,
    })
  } catch (err: unknown) {
    if (httpErrorResponse(err)?.status === 404) {
      store.clearCurrentEmployee()
      notFound.value = true
    } else {
      loadError.value = formatUnknownApiError(err) || t('employees.load_failed')
    }
  }
}

watch(editing, (isEdit) => {
  if (isEdit && employeeForm.value) {
    editFormData.value = { ...employeeForm.value.data }
    errorsMap.value = {}
  }
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId) load()
    editing.value = false
  },
  { immediate: true },
)

watch(
  [employeeDisplayName, locale],
  () => {
    document.title = formatDocumentTitle(employeeDisplayName.value)
  },
  { immediate: true },
)

function cancelEdit() {
  editing.value = false
  if (employeeForm.value) editFormData.value = { ...employeeForm.value.data }
}

async function onSave() {
  if (!employeeId.value || !employeeForm.value) return
  errorsMap.value = {}
  const { valid, errorsMap: clientErrors } = validateFormData(
    employeeForm.value.definition,
    editFormData.value,
  )
  if (!valid) {
    errorsMap.value = clientErrors
    scrollToFirstFormError()
    return
  }
  submitting.value = true
  try {
    await store.updateEmployee(employeeId.value, editFormData.value)
    editing.value = false
    success(t('employees.saved'))
  } catch (err: unknown) {
    const mapped = formErrorsMapFromHttpError(err)
    if (mapped) {
      errorsMap.value = mapped
      scrollToFirstFormError()
    } else {
      const msg = formatUnknownApiError(err) || t('employees.save_failed')
      errorsMap.value = { '': [msg] }
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.employee-detail-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-bottom: var(--space-md);
  box-sizing: border-box;
}

.employee-detail-form {
  width: 100%;
}

:deep(.form-content__viewport) {
  flex: 0 1 auto;
  overflow: visible;
  min-height: 0;
  padding: 0;
  gap: 0;
}

.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.inline-link {
  color: var(--brand-primary);
  margin-left: var(--space-xs);
}

.section-placeholder,
.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}
</style>
