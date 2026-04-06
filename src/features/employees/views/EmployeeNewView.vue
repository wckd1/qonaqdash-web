<template>
  <header class="page-header">
    <h1>{{ t('page_title.employee_new') }}</h1>
    <button v-if="employeeForm" type="button" :disabled="submitting" @click="onSubmit">
      {{ submitting ? t('common.saving') : t('common.save') }}
    </button>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <div v-else-if="loading" class="loading-state">{{ t('common.loading') }}</div>
  <template v-else-if="employeeForm">
    <FormEdit
      :definition="employeeForm.definition"
      :data="formData"
      :errors-map="errorsMap"
      @update:data="formData = $event"
    />
  </template>

  <Teleport to="body">
    <div
      v-if="inviteDialog.open"
      class="dialog-backdrop"
      role="presentation"
      @click.self="closeInviteDialog"
    >
      <div class="dialog employee-invite-dialog" role="dialog" aria-modal="true">
        <h2 class="employee-invite-dialog__title">{{ t('employees.invite_ready_title') }}</h2>
        <p class="employee-invite-dialog__body">{{ t('employees.invite_ready_body') }}</p>
        <label class="employee-invite-dialog__field">
          <span class="employee-invite-dialog__label">{{ t('employees.invite_token') }}</span>
          <input
            class="employee-invite-dialog__token"
            :value="inviteDialog.token"
            readonly
            @focus="selectInviteToken"
          />
        </label>
        <div class="dialog-actions employee-invite-dialog__actions">
          <button
            type="button"
            class="btn-secondary employee-invite-dialog__action"
            @click="goToList"
          >
            {{ t('employees.back_to_list') }}
          </button>
          <button
            type="button"
            class="btn-secondary employee-invite-dialog__action"
            @click="copyInviteToken"
          >
            {{ t('employees.copy_invite_token') }}
          </button>
          <button type="button" class="employee-invite-dialog__action" @click="goToEmployee">
            {{ t('employees.open_employee') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '@/features/employees/stores/useEmployeeStore'
import { formatUnknownApiError, formErrorsMapFromHttpError } from '@/shared/i18n/apiError'
import type { FormNode } from '@/shared/types/forms'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import { validateFormData } from '@/shared/form-dsl/validateFormData'
import { scrollToFirstFormError } from '@/shared/form-dsl/scrollToFirstError'
import { useNotification } from '@/shared/composables/useNotification'

const { t } = useI18n()
const router = useRouter()
const store = useEmployeeStore()
const { success } = useNotification()

const loading = ref(true)
const loadError = ref('')
const employeeForm = ref<{ definition: FormNode; data: Record<string, unknown> } | null>(null)
const formData = ref<Record<string, unknown>>({})
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)
const inviteDialog = ref({
  open: false,
  token: '',
  employeeId: '',
})

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    const template = await store.fetchEmployeeForm({
      target: 'edit',
      revalidate: true,
    })
    employeeForm.value = template as { definition: FormNode; data: Record<string, unknown> }
    formData.value = { ...(employeeForm.value.data ?? {}) }
  } catch (err: unknown) {
    loadError.value = formatUnknownApiError(err) || t('employees.form_load_failed')
    employeeForm.value = null
    formData.value = {}
  } finally {
    loading.value = false
  }
})

async function onSubmit() {
  errorsMap.value = {}
  const form = employeeForm.value
  if (!form) return
  const { valid, errorsMap: clientErrors } = validateFormData(form.definition, formData.value)
  if (!valid) {
    errorsMap.value = clientErrors
    scrollToFirstFormError()
    return
  }
  submitting.value = true
  try {
    const created = await store.createEmployee(formData.value)
    inviteDialog.value = {
      open: true,
      token: created.invite_token,
      employeeId: created.employee.id,
    }
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

function closeInviteDialog() {
  inviteDialog.value.open = false
}

function selectInviteToken(event: FocusEvent) {
  const target = event.target
  if (target instanceof HTMLInputElement) target.select()
}

async function copyInviteToken() {
  if (!inviteDialog.value.token) return
  await navigator.clipboard.writeText(inviteDialog.value.token)
  success(t('employees.invite_token_copied'))
}

async function goToEmployee() {
  const id = inviteDialog.value.employeeId
  inviteDialog.value.open = false
  if (id) {
    await router.push({ name: 'employee-detail', params: { id } })
  } else {
    await router.push({ name: 'employees' })
  }
}

async function goToList() {
  inviteDialog.value.open = false
  await router.push({ name: 'employees' })
}
</script>

<style scoped>
.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0 0 var(--space-md);
}

.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
}

.employee-invite-dialog__body {
  margin: 0 0 var(--space-lg);
  color: var(--ink-secondary);
  font-size: var(--text-body-size);
}

.employee-invite-dialog {
  max-width: 38rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.employee-invite-dialog__title {
  margin: 0;
}

.employee-invite-dialog__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
}

.employee-invite-dialog__label {
  font-size: var(--text-label-size);
  font-weight: var(--text-label-weight);
  color: var(--ink-primary);
}

.employee-invite-dialog__token {
  font-family:
    ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 1rem;
  letter-spacing: 0.01em;
}

.employee-invite-dialog__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
}

.employee-invite-dialog__action {
  min-height: 3.5rem;
}

@media (max-width: 640px) {
  .employee-invite-dialog__actions {
    grid-template-columns: 1fr;
  }
}
</style>
