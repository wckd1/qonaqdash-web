import { ref } from 'vue'
import type { FormNode } from '@/shared/types/forms'
import type { FieldSettingsDraft } from './formBuildMutations'

const blankFieldSettings = (): FieldSettingsDraft => ({
  label: '',
  type: 'Text',
  options: '',
  default: null,
  required: false,
})

export function useFormBuildModals() {
  const addingParent = ref<FormNode | null>(null)
  const updatingControl = ref<FormNode | null>(null)
  const fieldSettings = ref<FieldSettingsDraft>(blankFieldSettings())

  function resetFieldSettings() {
    fieldSettings.value = blankFieldSettings()
  }

  return {
    addingParent,
    updatingControl,
    fieldSettings,
    resetFieldSettings,
  }
}
