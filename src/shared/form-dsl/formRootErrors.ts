/**
 * Errors of an edit form that no control shows: they go to the alert above the form.
 */

import { INPUT_NODE_TYPES, type FormNode } from '@/shared/form-dsl/types'
import { resolveFormCatalogString } from '@/shared/i18n/formCatalog'
import { evaluateNodeState } from './formNodeConditions'
import { bindToPath, getValueByPath } from './utils'

function isLayout(node: FormNode): boolean {
  return node.type === 'stack' || node.type === 'group'
}

function nodeBind(node: FormNode): string {
  return 'bind' in node && typeof node.bind === 'string' ? node.bind : ''
}

/** Children of an array row as `ArrayRenderer` renders them: only inputs and nested arrays. */
function rowChildren(node: FormNode): FormNode[] {
  if (node.type !== 'array' || !node.child) return []
  const row = node.child
  const children = row.type === 'stack' || row.type === 'group' ? (row.children ?? []) : [row]
  return children.filter((c) => INPUT_NODE_TYPES.has(c.type) || c.type === 'array')
}

function collectShownBinds(
  node: FormNode,
  data: Record<string, unknown>,
  prefix: string,
  out: Set<string>,
): void {
  if (evaluateNodeState(node, data).hidden) return
  if (isLayout(node)) {
    for (const child of (node as { children?: FormNode[] }).children ?? []) {
      collectShownBinds(child, data, prefix, out)
    }
    return
  }
  const bind = nodeBind(node)
  if (node.type === 'button' || !bind) return
  const fullBind = prefix ? `${prefix}.${bind}` : bind
  if (node.type === 'array') {
    // The array shows no error of its own (e.g. `min_items`), only its rows do.
    const rows = getValueByPath(data, bindToPath(fullBind))
    const count = Array.isArray(rows) ? rows.length : 0
    for (let i = 0; i < count; i++) {
      for (const child of rowChildren(node)) {
        collectShownBinds(child, data, `${fullBind}.${i}`, out)
      }
    }
    return
  }
  out.add(fullBind)
}

/**
 * Full binds of the controls that show their own error, built the way the
 * edit renderers build them: array rows as `<array bind>.<index>.<field bind>`.
 * Hidden controls and array rows that are not there show nothing.
 */
export function shownErrorBinds(
  definition: FormNode | null | undefined,
  data: Record<string, unknown>,
): Set<string> {
  const out = new Set<string>()
  if (definition) collectShownBinds(definition, data, '', out)
  return out
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Label of the field an error bind belongs to, also when the field is hidden.
 * Inside an array the bind may carry the row (`stay.rooms.0.room_type`) or,
 * as the server reports row errors, only the field (`room_type`).
 *
 * @param rowPattern - regexp source of the row path when `node` is inside an array
 */
function fieldLabel(node: FormNode, bind: string, rowPattern = ''): string {
  if (isLayout(node)) {
    for (const child of (node as { children?: FormNode[] }).children ?? []) {
      const label = fieldLabel(child, bind, rowPattern)
      if (label) return label
    }
    return ''
  }
  const own = nodeBind(node)
  if (node.type === 'button' || !own) return ''
  const matches = rowPattern
    ? bind === own || new RegExp(`^${rowPattern}\\.${escapeRegExp(own)}$`).test(bind)
    : bind === own
  if (matches) return resolveFormCatalogString((node as { label?: string }).label ?? '')
  if (node.type === 'array') {
    const arrayPattern = rowPattern ? `${rowPattern}\\.${escapeRegExp(own)}` : escapeRegExp(own)
    for (const child of rowChildren(node)) {
      const label = fieldLabel(child, bind, `${arrayPattern}\\.\\d+`)
      if (label) return label
    }
  }
  return ''
}

/**
 * Messages for the alert above an edit form: form-level errors (bind `""`)
 * and errors of binds that no shown control displays, e.g. a server error on
 * a hidden field or on a field the form does not have. Such an error is
 * prefixed with the field label when the definition has the field. No error
 * of `errorsMap` is left unshown.
 */
export function formRootErrors(
  definition: FormNode | null | undefined,
  data: Record<string, unknown>,
  errorsMap: Record<string, string[]>,
): string[] {
  const shown = shownErrorBinds(definition, data)
  const out: string[] = []
  const add = (message: string) => {
    if (message && !out.includes(message)) out.push(message)
  }
  for (const message of errorsMap[''] ?? []) add(message)
  for (const [bind, messages] of Object.entries(errorsMap)) {
    if (!bind || shown.has(bind)) continue
    const label = definition ? fieldLabel(definition, bind) : ''
    for (const message of messages ?? []) add(label ? `${label}: ${message}` : message)
  }
  return out
}
