import { requireMainUser } from './fixtures/seed-users'

/** Must match `server.proxy['/api'].target` in vite.config.ts. */
const BACKEND_URL = 'http://localhost:8080'

/** Fails fast with a clear message instead of timing out in every test. */
export default async function globalSetup(): Promise<void> {
  requireMainUser()

  try {
    // Any HTTP response means the backend is up; 401 is expected without a token.
    await fetch(`${BACKEND_URL}/api/account`, { signal: AbortSignal.timeout(5000) })
  } catch {
    throw new Error(
      `Backend is not reachable at ${BACKEND_URL}. Start it in ../qonaqdash with ` +
        '`make up && make reset-db && make server`.',
    )
  }
}
