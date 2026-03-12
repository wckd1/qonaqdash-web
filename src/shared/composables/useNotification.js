import { reactive, readonly } from 'vue'

const state = reactive({ items: [] })
let nextId = 0

function addNotification(message, type = 'info', duration = 5000) {
  const id = nextId++
  state.items.push({ id, message, type })
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
  return id
}

function dismiss(id) {
  const idx = state.items.findIndex(n => n.id === id)
  if (idx !== -1) state.items.splice(idx, 1)
}

export function useNotification() {
  return {
    notifications: readonly(state).items,
    notify: addNotification,
    error: (msg) => addNotification(msg, 'error', 7000),
    success: (msg) => addNotification(msg, 'success', 4000),
    info: (msg) => addNotification(msg, 'info', 5000),
    dismiss,
  }
}
