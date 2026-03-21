/**
 * Mutations for JSONForm WYSIWYG builder (schema + uischema). Mutates objects in place.
 */
import { scopeToPath, getSchemaEntry } from '../utils'

/** Max direct children for HorizontalLayout (row has two columns + add affordance). */
export const MAX_HORIZONTAL_LAYOUT_CHILDREN = 2

function generateFieldId() {
  return `field_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * @param {object} root - Root uischema element
 * @param {object} target
 * @returns {{ ancestors: object[] } | null}
 */
export function findAncestors(root, target) {
  if (target === root) return { ancestors: [] }
  function walk(elements, ancestors) {
    if (!Array.isArray(elements)) return null
    for (const el of elements) {
      if (el === target) return { ancestors }
      const kids = el.elements
      if (kids?.length) {
        const r = walk(kids, [...ancestors, el])
        if (r) return r
      }
    }
    return null
  }
  const top = root.elements
  if (!top) return null
  return walk(top, [root])
}

/**
 * @param {object} root
 * @param {object} target
 * @returns {{ parentElements: object[], index: number, node: object, ancestors: object[] } | null}
 */
export function findNodeContext(root, target) {
  if (target === root) {
    return { parentElements: null, index: -1, node: root, ancestors: [] }
  }
  function walk(elements, ancestors) {
    if (!Array.isArray(elements)) return null
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      if (el === target) {
        return { parentElements: elements, index: i, node: el, ancestors }
      }
      const kids = el.elements
      if (kids?.length) {
        const r = walk(kids, [...ancestors, el])
        if (r) return r
      }
    }
    return null
  }
  const top = root.elements
  if (!top) return null
  return walk(top, [root])
}

/**
 * @param {object} parent - Container receiving the new child
 * @param {object} root
 * @returns {boolean}
 */
function isInsideGroup(parent, root) {
  if (parent?.type === 'Group') return true
  const chain = findAncestors(root, parent)
  return !!(chain && chain.ancestors.some((a) => a.type === 'Group'))
}

/**
 * @param {object} parent
 * @param {object} root
 * @param {string} type - VerticalLayout | HorizontalLayout | Group | Field
 * @returns {boolean}
 */
export function isAddTypeAllowed(parent, root, type) {
  if (!parent) return false
  const insideGroup = isInsideGroup(parent, root)
  const same = parent.type
  if (type === same) return false
  if (type === 'Field') {
    return parent.type === 'Group' || ((parent.type === 'VerticalLayout' || parent.type === 'HorizontalLayout') && insideGroup)
  }
  if (type === 'Group') {
    return !((parent.type === 'VerticalLayout' || parent.type === 'HorizontalLayout') && insideGroup)
  }
  return true
}

/**
 * @param {object} parent
 * @param {object} root
 * @returns {string[]}
 */
export function allowedAddTypes(parent, root) {
  const candidates = ['VerticalLayout', 'HorizontalLayout', 'Group', 'Field']
  return candidates.filter((t) => isAddTypeAllowed(parent, root, t))
}

function removeSchemaPropertyByScope(schema, scope) {
  const parts = scope.replace(/^#\//, '').split('/')
  let node = schema
  for (let i = 0; i < parts.length - 2; i += 2) {
    const key = parts[i + 1]
    if (parts[i] === 'properties') node = node?.properties?.[key]
    else if (parts[i] === 'items') node = node?.items
    if (!node) return
  }
  const propName = parts[parts.length - 1]
  if (node.properties && Object.prototype.hasOwnProperty.call(node.properties, propName)) {
    delete node.properties[propName]
  }
}

function removeSchemaPropertyByGroupId(schema, groupId, ancestors) {
  let node = schema
  for (const anc of ancestors) {
    const id = anc?.id
    if (id && node.properties?.[id]) node = node.properties[id]
    else break
  }
  if (node.properties && Object.prototype.hasOwnProperty.call(node.properties, groupId)) {
    delete node.properties[groupId]
  }
}

function pruneSchemaForNode(ui, ancestors, schema) {
  if (!ui) return
  switch (ui.type) {
    case 'Control':
      if (ui.scope) removeSchemaPropertyByScope(schema, ui.scope)
      break
    case 'Group':
      if (ui.id) removeSchemaPropertyByGroupId(schema, ui.id, ancestors)
      break
    case 'VerticalLayout':
    case 'HorizontalLayout':
    default:
      ui.elements?.forEach((c) => pruneSchemaForNode(c, [...ancestors, ui], schema))
  }
}

/**
 * @param {object} schema
 * @param {object} rootUischema
 * @param {object} target
 * @returns {boolean}
 */
export function removeBuildNode(schema, rootUischema, target) {
  const ctx = findNodeContext(rootUischema, target)
  if (!ctx || ctx.index < 0 || !ctx.parentElements) return false
  pruneSchemaForNode(ctx.node, ctx.ancestors, schema)
  ctx.parentElements.splice(ctx.index, 1)
  return true
}

/**
 * @param {object} element
 */
/**
 * @param {object} element - VerticalLayout or HorizontalLayout
 * @returns {boolean} Whether the type was changed
 */
export function toggleLayoutDirection(element) {
  if (element.type === 'VerticalLayout') {
    const n = element.elements?.length ?? 0
    if (n > MAX_HORIZONTAL_LAYOUT_CHILDREN) return false
    element.type = 'HorizontalLayout'
    return true
  }
  if (element.type === 'HorizontalLayout') {
    element.type = 'VerticalLayout'
    return true
  }
  return false
}

/**
 * @param {object} schema
 * @param {object} parent - Container uischema (must gain .elements)
 * @param {string} type - Field | VerticalLayout | HorizontalLayout | Group
 */
export function addBuildChild(schema, parent, type) {
  if (!parent) return
  if (parent.type === 'HorizontalLayout') {
    const n = parent.elements?.length ?? 0
    if (n >= MAX_HORIZONTAL_LAYOUT_CHILDREN) return
  }
  const id = generateFieldId()
  if (!parent.elements) parent.elements = []

  if (type === 'Field') {
    if (!schema.properties || typeof schema.properties !== 'object') {
      schema.properties = {}
    }
    let schemaTarget = schema.properties
    let scope = `#/properties/${id}`

    if (parent.type === 'Group' && parent.id) {
      const groupFrag = schema.properties?.[parent.id]
      if (groupFrag?.type === 'object') {
        if (!groupFrag.properties) groupFrag.properties = {}
        schemaTarget = groupFrag.properties
        scope = `#/properties/${parent.id}/properties/${id}`
      }
    }

    if (!schema.properties || typeof schema.properties !== 'object') {
      schema.properties = {}
    }
    if (schemaTarget === schema.properties && !schema.properties[id]) {
      schema.properties[id] = { type: 'string', title: 'Field' }
    } else if (schemaTarget && !schemaTarget[id]) {
      schemaTarget[id] = { type: 'string', title: 'Field' }
    }

    parent.elements.push({
      type: 'Control',
      scope,
      label: 'Field',
    })
    return
  }

  const newEl = {
    type,
    elements: [],
  }
  if (type === 'Group') {
    newEl.id = id
    if (!schema.properties) schema.properties = {}
    schema.properties[id] = {
      type: 'object',
      properties: {},
    }
  }
  parent.elements.push(newEl)
}

/**
 * @param {object} control - Control uischema
 * @param {object} schema
 * @returns {{ label: string, type: string, options: string, default: *, required: boolean }}
 */
export function readControlFieldSettings(control, schema) {
  const scope = control.scope
  const path = scopeToPath(scope)
  if (!path.length) {
    return {
      label: control.label || '',
      type: 'Text',
      options: '',
      default: null,
      required: false,
    }
  }
  const fieldId = path[path.length - 1]
  const parentPath = path.slice(0, -1)
  const parentNode = parentPath.length ? getSchemaEntry(schema, parentPath) : schema
  const fieldSchema = parentNode?.properties?.[fieldId] ?? {}

  let uiType = 'Text'
  if (Array.isArray(fieldSchema.oneOf) && fieldSchema.oneOf.length) uiType = 'Enum'
  else if (Array.isArray(fieldSchema.enum) && fieldSchema.enum.length) uiType = 'Enum'
  else if (fieldSchema.format === 'email') uiType = 'Email'
  else if (fieldSchema.format === 'date' || fieldSchema.format === 'date-time') uiType = 'Date'
  else if (fieldSchema.type === 'integer' || fieldSchema.type === 'number') uiType = 'Number'
  else if (fieldSchema.type === 'string') uiType = 'Text'

  const options =
    Array.isArray(fieldSchema.enum) && fieldSchema.enum.length
      ? fieldSchema.enum.join(', ')
      : ''

  const required = !!(Array.isArray(parentNode?.required) && parentNode.required.includes(fieldId))

  return {
    label: control.label ?? fieldSchema.title ?? '',
    type: uiType,
    options,
    default: fieldSchema.default ?? null,
    required,
  }
}

/**
 * @param {object} control
 * @param {object} schema
 * @param {{ label: string, type: string, options: string, default: *, required: boolean }} settings
 */
export function applyControlFieldSettings(control, schema, settings) {
  const scope = control.scope
  const path = scopeToPath(scope)
  if (!path.length) return

  control.label = settings.label

  const fieldId = path[path.length - 1]
  const parentPath = path.slice(0, -1)
  const parentNode = parentPath.length ? getSchemaEntry(schema, parentPath) : schema
  if (!parentNode?.properties?.[fieldId]) return

  const fieldSchema = parentNode.properties[fieldId]
  fieldSchema.title = settings.label

  delete fieldSchema.format
  delete fieldSchema.enum
  delete fieldSchema.oneOf

  switch (settings.type) {
    case 'Text':
      fieldSchema.type = 'string'
      break
    case 'Email':
      fieldSchema.type = 'string'
      fieldSchema.format = 'email'
      break
    case 'Date':
      fieldSchema.type = 'string'
      fieldSchema.format = 'date-time'
      break
    case 'Number':
      fieldSchema.type = 'integer'
      break
    case 'Enum':
      fieldSchema.type = 'string'
      fieldSchema.enum = settings.options
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      break
    default:
      fieldSchema.type = 'string'
  }

  if (settings.default !== null && settings.default !== undefined && settings.default !== '') {
    fieldSchema.default = settings.default
  } else {
    delete fieldSchema.default
  }

  if (settings.required) {
    if (!Array.isArray(parentNode.required)) parentNode.required = []
    if (!parentNode.required.includes(fieldId)) parentNode.required.push(fieldId)
  } else if (Array.isArray(parentNode.required)) {
    parentNode.required = parentNode.required.filter((x) => x !== fieldId)
    if (parentNode.required.length === 0) delete parentNode.required
  }
}
