/**
 * Mutations for FormDSL WYSIWYG builder. Mutates definition nodes in place.
 */

import type { FormNode, FormStackNode, FormGroupNode, FormInputNode } from '@/shared/types/forms'

/** Max direct children for horizontal stacks. */
export const MAX_HORIZONTAL_LAYOUT_CHILDREN = 2

function generateFieldId(): string {
  return `field_${Math.random().toString(36).slice(2, 9)}`
}

function getLayoutChildren(node: FormNode): FormNode[] | null {
  if ((node.type === 'stack' || node.type === 'group') && Array.isArray(node.children)) {
    return node.children
  }
  return null
}

export function findAncestors(root: FormNode, target: FormNode): { ancestors: FormNode[] } | null {
  if (target === root) return { ancestors: [] }
  function walk(items: FormNode[], ancestors: FormNode[]): { ancestors: FormNode[] } | null {
    for (const el of items) {
      if (el === target) return { ancestors }
      const kids = getLayoutChildren(el)
      if (kids?.length) {
        const r = walk(kids, [...ancestors, el])
        if (r) return r
      }
    }
    return null
  }
  const top = getLayoutChildren(root)
  if (!top) return null
  return walk(top, [root])
}

interface NodeContext {
  parentItems: FormNode[] | null
  index: number
  node: FormNode
  ancestors: FormNode[]
}

export function findNodeContext(root: FormNode, target: FormNode): NodeContext | null {
  if (target === root) {
    return { parentItems: null, index: -1, node: root, ancestors: [] }
  }
  function walk(items: FormNode[], ancestors: FormNode[]): NodeContext | null {
    for (let i = 0; i < items.length; i++) {
      const el = items[i]
      if (el === target) {
        return { parentItems: items, index: i, node: el, ancestors }
      }
      const kids = getLayoutChildren(el)
      if (kids?.length) {
        const r = walk(kids, [...ancestors, el])
        if (r) return r
      }
    }
    return null
  }
  const top = getLayoutChildren(root)
  if (!top) return null
  return walk(top, [root])
}

function isInsideGroup(parent: FormNode, root: FormNode): boolean {
  if (parent.type === 'group') return true
  const chain = findAncestors(root, parent)
  return !!(chain && chain.ancestors.some((a) => a.type === 'group'))
}

export function isAddTypeAllowed(parent: FormNode, root: FormNode, type: string): boolean {
  const insideGroup = isInsideGroup(parent, root)
  if (type === 'Field') {
    return parent.type === 'group' || (parent.type === 'stack' && insideGroup)
  }
  if (type === 'Group') {
    return !(parent.type === 'stack' && insideGroup)
  }
  if (type === 'VerticalStack' || type === 'HorizontalStack') {
    return true
  }
  return true
}

export function allowedAddTypes(parent: FormNode, root: FormNode): string[] {
  const candidates = ['VerticalStack', 'HorizontalStack', 'Group', 'Field']
  return candidates.filter((t) => isAddTypeAllowed(parent, root, t))
}

export function removeBuildNode(root: FormNode, target: FormNode): boolean {
  const ctx = findNodeContext(root, target)
  if (!ctx || ctx.index < 0 || !ctx.parentItems) return false
  ctx.parentItems.splice(ctx.index, 1)
  return true
}

export function toggleLayoutDirection(element: FormNode): boolean {
  if (element.type !== 'stack') return false
  const stack = element as FormStackNode
  if (stack.direction === 'vertical') {
    const n = stack.children?.length ?? 0
    if (n > MAX_HORIZONTAL_LAYOUT_CHILDREN) return false
    stack.direction = 'horizontal'
    return true
  }
  if (stack.direction === 'horizontal') {
    stack.direction = 'vertical'
    return true
  }
  return false
}

export function addBuildChild(parent: FormNode, type: string): void {
  if (!parent) return
  if (parent.type !== 'stack' && parent.type !== 'group') return
  const items = getLayoutChildren(parent)

  if (parent.type === 'stack' && (parent as FormStackNode).direction === 'horizontal') {
    if ((items?.length ?? 0) >= MAX_HORIZONTAL_LAYOUT_CHILDREN) return
  }

  const parentItems = items ?? ((parent as FormStackNode | FormGroupNode).children = [])
  const id = generateFieldId()

  if (type === 'Field') {
    const newField: FormInputNode = {
      type: 'string',
      id,
      label: 'Field',
      bind: id,
    }
    parentItems.push(newField)
    return
  }

  if (type === 'Group') {
    const newGroup: FormGroupNode = {
      type: 'group',
      id,
      title: '',
      children: [],
    }
    parentItems.push(newGroup)
    return
  }

  if (type === 'VerticalStack' || type === 'HorizontalStack') {
    const newStack: FormStackNode = {
      type: 'stack',
      direction: type === 'HorizontalStack' ? 'horizontal' : 'vertical',
      children: [],
    }
    parentItems.push(newStack)
    return
  }
}

export interface FieldSettingsDraft {
  label: string
  type: string
  options: string
  default: string | number | boolean | null
  required: boolean
}

export function readControlFieldSettings(node: FormNode): FieldSettingsDraft {
  if (!('bind' in node)) {
    return { label: '', type: 'Text', options: '', default: null, required: false }
  }
  const input = node as FormInputNode
  let uiType = 'Text'
  if (node.type === 'select') uiType = 'Enum'
  else if (node.type === 'email') uiType = 'Email'
  else if (node.type === 'date' || node.type === 'datetime') uiType = 'Date'
  else if (node.type === 'number') uiType = 'Number'

  const selectItems =
    node.type === 'select'
      ? ((node as { items?: Array<{ value: unknown }> }).items ?? [])
          .map((i) => String(i.value ?? ''))
          .filter(Boolean)
          .join(', ')
      : ''

  return {
    label: input.label ?? '',
    type: uiType,
    options: selectItems,
    default: null,
    required: input.rules?.required ?? false,
  }
}

export function applyControlFieldSettings(node: FormNode, settings: FieldSettingsDraft): void {
  if (!('bind' in node)) return
  const raw = node as unknown as Record<string, unknown>
  raw.label = settings.label

  delete raw.items

  switch (settings.type) {
    case 'Text':
      raw.type = 'string'
      break
    case 'Email':
      raw.type = 'email'
      break
    case 'Date':
      raw.type = 'datetime'
      break
    case 'Number':
      raw.type = 'number'
      break
    case 'Enum': {
      raw.type = 'select'
      const opts = settings.options
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      raw.items = opts.map((v) => ({ value: v }))
      break
    }
    default:
      raw.type = 'string'
  }

  delete raw.validation
  const existing = raw.rules
  const rules: Record<string, unknown> = {
    ...(existing && typeof existing === 'object' && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {}),
  }
  if (settings.required) {
    rules.required = true
    raw.rules = rules
  } else {
    delete rules.required
    if (Object.keys(rules).length === 0) {
      delete raw.rules
    } else {
      raw.rules = rules
    }
  }
}
