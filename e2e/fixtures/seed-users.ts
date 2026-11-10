/**
 * Seed users for e2e. The backend creates them with `make reset-db` and lists
 * their credentials in its README (local run section). Keep this list in sync
 * with that README.
 *
 * The first entry is the main user for the smoke scenarios: it must see the
 * dashboard and view and create bookings. `E2E_USER_EMAIL` and
 * `E2E_USER_PASSWORD` override it for a single run.
 */

export interface SeedUser {
  /** Role as named in the backend README, used in test titles. */
  role: string
  email: string
  password: string
}

// Backend README, section "Demo users". The owner has full rights in Qonaq City Hotel.
const DEMO_PASSWORD = 'demo12345'

export const SEED_USERS: SeedUser[] = [
  { role: 'owner', email: 'owner@qonaqdash.test', password: DEMO_PASSWORD },
  { role: 'director', email: 'director@qonaqdash.test', password: DEMO_PASSWORD },
  { role: 'reception', email: 'reception@qonaqdash.test', password: DEMO_PASSWORD },
  { role: 'housekeeper', email: 'housekeeper@qonaqdash.test', password: DEMO_PASSWORD },
  { role: 'technician', email: 'maintenance@qonaqdash.test', password: DEMO_PASSWORD },
  { role: 'viewer', email: 'viewer@qonaqdash.test', password: DEMO_PASSWORD },
]

export function mainUser(): SeedUser | null {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD
  if (email && password) return { role: 'main', email, password }
  return SEED_USERS[0] ?? null
}

export function requireMainUser(): SeedUser {
  const user = mainUser()
  if (!user) {
    throw new Error(
      'E2E credentials are not configured. Fill SEED_USERS in e2e/fixtures/seed-users.ts ' +
        'from the backend README or set E2E_USER_EMAIL and E2E_USER_PASSWORD.',
    )
  }
  return user
}

/** Seed user by role as named in the backend README. */
export function seedUser(role: string): SeedUser {
  const user = SEED_USERS.find((u) => u.role === role)
  if (!user) throw new Error(`No seed user with role "${role}" in e2e/fixtures/seed-users.ts`)
  return user
}
