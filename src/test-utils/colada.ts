import { createApp, effectScope, type App, type EffectScope } from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { PiniaColada, useQueryCache, type QueryCache } from '@pinia/colada'
import { piniaColadaOptions } from '@/shared/api/queryCache'

export interface ColadaTestContext {
  app: App
  pinia: Pinia
  queryCache: QueryCache
  /** Runs a composable inside the app context, as a component setup would. */
  run<T>(fn: () => T): T
  /** Stops every scope started with `run`, like unmounting the components. */
  stop(): void
}

/** Fresh Pinia with Pinia Colada installed the same way as in `main.ts`. */
export function setupColada(): ColadaTestContext {
  const app = createApp({ render: () => null })
  const pinia = createPinia()
  app.use(pinia)
  app.use(PiniaColada, piniaColadaOptions)
  setActivePinia(pinia)
  const scopes: EffectScope[] = []
  return {
    app,
    pinia,
    queryCache: useQueryCache(pinia),
    run(fn) {
      const scope = effectScope()
      scopes.push(scope)
      return app.runWithContext(() => scope.run(fn)!)
    },
    stop() {
      scopes.splice(0).forEach((scope) => scope.stop())
    },
  }
}
