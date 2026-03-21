import { ref } from 'vue'

const blankFieldSettings = () => ({
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
  const addingParent = ref(null)
  const updatingControl = ref(null)
  const fieldSettings = ref(blankFieldSettings())

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
