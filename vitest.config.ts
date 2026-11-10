import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      root: fileURLToPath(new URL('./', import.meta.url)),
      environment: 'jsdom',
      include: ['src/**/*.test.ts'],
      // Same results on every machine and in CI.
      env: { TZ: 'UTC' },
      restoreMocks: true,
      unstubGlobals: true,
    },
  }),
)
