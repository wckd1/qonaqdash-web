import type { Component } from 'vue'
import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { i18n } from '@/i18n'
import { piniaColadaOptions } from '@/shared/api/queryCache'

/**
 * Mounts a component with Pinia, Pinia Colada and i18n installed as in
 * `main.ts`, with the UI in English. Pass a router in `global.plugins` or stub
 * `router-link` in `global.stubs` when the component needs one.
 */
export function mountWithApp<C extends Component>(
  component: C,
  options: ComponentMountingOptions<C> = {},
) {
  const pinia = createPinia()
  setActivePinia(pinia)
  i18n.global.locale.value = 'en'
  const global = options.global ?? {}
  return mount(component, {
    ...options,
    global: {
      ...global,
      plugins: [pinia, [PiniaColada, piniaColadaOptions], i18n, ...(global.plugins ?? [])],
    },
  } as ComponentMountingOptions<C>)
}
