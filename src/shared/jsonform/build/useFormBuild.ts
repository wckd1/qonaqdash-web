import { ref } from 'vue'

export type FieldSettingsDraft = {
  label: string
  type: string
  options: string
  default: string | number | boolean | null
  required: boolean
}

const blankFieldSettings = (): FieldSettingsDraft => ({
  label: '',
  type: 'Text',
  options: '',
  default: null,
  required: false,
})

/**
 * Modal / draft state for the JSONForm WYSIWYG builder.
 */
export function useFormBuildModals() {
  const addingParent = ref<Record<string, unknown> | null>(null)
  const updatingControl = ref<Record<string, unknown> | null>(null)
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
