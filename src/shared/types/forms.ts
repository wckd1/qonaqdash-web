/** `_form` on guest/booking detail payloads — canonical definition fingerprint (see `docs/forms-caching.md`). */
export interface FormRef {
  id: string
  hash: string
}

// ---------------------------------------------------------------------------
// FormDSL node types (see docs/forms-dsl.md)
// ---------------------------------------------------------------------------

export type FormNodeType =
  | 'stack'
  | 'group'
  | 'array'
  | 'button'
  | 'string'
  | 'textarea'
  | 'email'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'datetime'
  | 'date-range'
  | 'number-range'

export const INPUT_NODE_TYPES: ReadonlySet<string> = new Set([
  'string',
  'textarea',
  'email',
  'number',
  'checkbox',
  'select',
  'date',
  'datetime',
  'date-range',
  'number-range',
])

export interface FormCondition {
  bind: string
  equals?: unknown
  not_equals?: unknown
  in?: unknown[]
  not_in?: unknown[]
  exists?: true
}

export type FormConditionOrArray = FormCondition | FormCondition[]

export interface FormActionStep {
  type: 'set_value' | 'toggle_value' | 'clear_value'
  bind: string
  value?: unknown
}

export interface FormValidation {
  required?: boolean
  min_length?: number
  max_length?: number
  min?: number
  max?: number
}

export interface FormSelectItem {
  value: unknown
  label?: string
  disabled?: boolean
}

export interface FormNodeOptions {
  locked?: boolean
  hidden?: boolean
  placeholder?: string
  [key: string]: unknown
}

interface FormNodeConditions {
  visible_when?: FormConditionOrArray
  hidden_when?: FormConditionOrArray
  enabled_when?: FormConditionOrArray
  disabled_when?: FormConditionOrArray
}

export interface FormStackNode extends FormNodeConditions {
  type: 'stack'
  direction: 'vertical' | 'horizontal'
  items: FormNode[]
  options?: FormNodeOptions
}

export interface FormGroupNode extends FormNodeConditions {
  type: 'group'
  id: string
  title?: string
  items: FormNode[]
  options?: FormNodeOptions
}

export interface FormInputNode extends FormNodeConditions {
  type:
    | 'string'
    | 'textarea'
    | 'email'
    | 'number'
    | 'checkbox'
    | 'date'
    | 'datetime'
    | 'date-range'
    | 'number-range'
  id: string
  label?: string
  bind: string
  validation?: FormValidation
  actions?: FormActionStep[]
  readonly?: boolean
  options?: FormNodeOptions
}

export interface FormSelectNode extends FormNodeConditions {
  type: 'select'
  id: string
  label?: string
  bind: string
  items: FormSelectItem[]
  validation?: FormValidation
  actions?: FormActionStep[]
  readonly?: boolean
  options?: FormNodeOptions
}

export interface FormArrayNode extends FormNodeConditions {
  type: 'array'
  id: string
  label?: string
  bind: string
  min_items?: number
  max_items?: number
  item: FormNode
  options?: FormNodeOptions
}

export interface FormButtonNode extends FormNodeConditions {
  type: 'button'
  id: string
  label?: string
  actions: FormActionStep[]
  options?: FormNodeOptions
}

export type FormNode =
  | FormStackNode
  | FormGroupNode
  | FormInputNode
  | FormSelectNode
  | FormArrayNode
  | FormButtonNode

/** Check whether a node is a layout container (stack / group). */
export function isLayoutNode(node: FormNode): node is FormStackNode | FormGroupNode {
  return node.type === 'stack' || node.type === 'group'
}

/** Check whether a node is an input (leaf with `bind`). */
export function isInputNode(node: FormNode): node is FormInputNode | FormSelectNode {
  return INPUT_NODE_TYPES.has(node.type)
}
