import type { APIRequestContext, Page } from '@playwright/test'
import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'
import { apiSession } from './fixtures/employees'
import { seedUser } from './fixtures/seed-users'

test.use({ storageState: MAIN_USER_STATE })

/** The demo hotels live in Almaty, which keeps +05:00 all year. */
const HOTEL_ZONE = 'Asia/Almaty'
const HOTEL_OFFSET = '+05:00'

type Headers = Record<string, string>
type Room = { id: string; number: string; room_type_id: string }

/** A hotel-local date far in the future, so the stays do not meet seed data or earlier runs. */
function farDate(): string {
  const day = Date.UTC(2031, 0, 1) + Math.floor(Math.random() * 3000) * 86_400_000
  return new Date(day).toISOString().slice(0, 10)
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

/** RFC 3339 moment of the hotel clock. */
function hotelMoment(date: string, time: string): string {
  return `${date}T${time}:00${HOTEL_OFFSET}`
}

/** Intl puts a narrow no-break space before AM/PM in some ICU versions. */
function spaces(value: string | null): string {
  return (value ?? '').replace(/\s/g, ' ')
}

/** A moment as the UI shows it in the zone, with the zone offset label. */
function shownIn(moment: string, timeZone: string): string {
  const options = { timeZone, dateStyle: 'short', timeStyle: 'short' } as const
  const text = new Intl.DateTimeFormat('en-US', options).format(new Date(moment))
  const zone = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date(moment))
    .find((p) => p.type === 'timeZoneName')?.value
  return spaces(`${text} ${zone}`)
}

function hotelToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: HOTEL_ZONE }).format(new Date())
}

/** Owner session; checks once that the demo hotel lives in the zone the scenarios expect. */
async function owner(request: APIRequestContext): Promise<Headers> {
  const headers = await apiSession(request, seedUser('owner'))
  const hotel = (await (await request.get('/api/property/hotel', { headers })).json()) as {
    timezone: string
  }
  expect(hotel.timezone).toBe(HOTEL_ZONE)
  return headers
}

async function room(request: APIRequestContext, headers: Headers, number: string): Promise<Room> {
  const rooms = (await (
    await request.get('/api/property/rooms/available', { headers })
  ).json()) as Room[]
  const found = rooms.find((r) => r.number === number)
  if (!found) throw new Error(`No room ${number} in the demo hotel`)
  return found
}

async function book(
  request: APIRequestContext,
  headers: Headers,
  stay: { room: Room; checkIn: string; checkOut: string; lastName: string },
): Promise<string> {
  const res = await request.post('/api/bookings', {
    headers,
    data: {
      guest: {
        first_name: 'Time',
        last_name: stay.lastName,
        email: `${stay.lastName.toLowerCase().replace(/\W+/g, '-')}@example.test`,
      },
      stay: {
        check_in: stay.checkIn,
        check_out: stay.checkOut,
        rooms: [{ room_type: stay.room.room_type_id, room_id: stay.room.id }],
      },
    },
  })
  expect(res.status(), await res.text()).toBe(201)
  return ((await res.json()) as { id: string }).id
}

async function cancel(request: APIRequestContext, headers: Headers, ids: string[]) {
  for (const id of ids) await request.put(`/api/bookings/${id}/cancel`, { headers })
}

function gridCell(page: Page, number: string, date: string) {
  const name = en.grid.cell_aria.replace('{number}', number).replace('{date}', date)
  return page.getByRole('button', { name, exact: true })
}

function bar(page: Page, lastName: string) {
  return page.locator('.reservation-bar', { hasText: lastName })
}

function runName(label: string): string {
  return `E2E ${label} ${Date.now().toString(36)}`
}

test.describe('reservation grid by hotel nights', () => {
  // F5: canceled bookings were shown and blocked their cells.
  test('does not show a canceled booking and leaves its nights free', async ({ page, request }) => {
    const headers = await owner(request)
    const day = farDate()
    const [r103, r104] = [await room(request, headers, '103'), await room(request, headers, '104')]
    const canceledName = runName('Canceled')
    const keptName = runName('Kept')
    const canceled = await book(request, headers, {
      room: r104,
      checkIn: hotelMoment(day, '14:00'),
      checkOut: hotelMoment(addDays(day, 2), '12:00'),
      lastName: canceledName,
    })
    await cancel(request, headers, [canceled])
    const kept = await book(request, headers, {
      room: r103,
      checkIn: hotelMoment(day, '14:00'),
      checkOut: hotelMoment(addDays(day, 2), '12:00'),
      lastName: keptName,
    })
    try {
      await page.goto(`/?from=${addDays(day, -1)}&to=${addDays(day, 3)}`)

      await expect(bar(page, keptName)).toBeVisible()
      await expect(bar(page, canceledName)).toHaveCount(0)
      await gridCell(page, '104', day).click()
      await expect(page.getByRole('menuitem', { name: en.grid.create_booking })).toBeVisible()
    } finally {
      await cancel(request, headers, [kept])
    }
  })

  // F5: an arrival on the last visible day was not shown.
  test('shows an arrival on the last visible day', async ({ page, request }) => {
    const headers = await owner(request)
    const day = farDate()
    const lastName = runName('Arrival')
    const id = await book(request, headers, {
      room: await room(request, headers, '103'),
      checkIn: hotelMoment(day, '14:00'),
      checkOut: hotelMoment(addDays(day, 2), '12:00'),
      lastName,
    })
    try {
      await page.goto(`/?from=${addDays(day, -6)}&to=${day}`)

      await expect(bar(page, lastName)).toBeVisible()
    } finally {
      await cancel(request, headers, [id])
    }
  })

  // F5 and the night inventory: a stay from the check-out day of the previous
  // guest fits, even with a check-in before that guest leaves.
  test('books a back-to-back stay with an early check-in from the grid', async ({
    page,
    request,
  }) => {
    const headers = await owner(request)
    const day = farDate()
    const r104 = await room(request, headers, '104')
    const firstName = runName('First')
    const nextName = runName('Next')
    const ids = [
      await book(request, headers, {
        room: r104,
        checkIn: hotelMoment(day, '14:00'),
        checkOut: hotelMoment(addDays(day, 2), '12:00'),
        lastName: firstName,
      }),
    ]
    const departure = addDays(day, 2)
    try {
      await page.goto(`/?from=${addDays(day, -1)}&to=${addDays(day, 4)}`)
      await expect(bar(page, firstName)).toBeVisible()

      await gridCell(page, '104', departure).click()
      await page.getByRole('menuitem', { name: en.grid.create_booking }).click()

      // The selected night: check-in at the hotel check-in hour, check-out the next day.
      await expect(page.getByLabel(en.fields.check_in)).toHaveValue(`${departure}T14:00`)
      await expect(page.getByLabel(en.fields.check_out)).toHaveValue(
        `${addDays(departure, 1)}T12:00`,
      )
      await page.getByLabel(en.fields.check_in).fill(`${departure}T10:00`)
      await page.getByLabel(en.fields.last_name).fill(nextName)
      await page.getByLabel(en.fields.first_name).fill('Time')
      await page.getByLabel(en.fields.email).fill(`next-${Date.now()}@example.test`)

      const created = page.waitForResponse(
        (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/bookings',
      )
      await page.getByRole('button', { name: en.common.save, exact: true }).click()
      const response = await created
      expect(response.status()).toBe(201)
      const booking = (await response.json()) as { id: string; stay: { check_in: string } }
      ids.push(booking.id)
      // The time entered is the hotel clock.
      expect(booking.stay.check_in).toBe(hotelMoment(departure, '10:00'))
      await expect(page).toHaveURL(/\/bookings\/[^/]+\/details$/)

      await page.goto(`/?from=${addDays(day, -1)}&to=${addDays(day, 4)}`)
      await expect(bar(page, firstName)).toBeVisible()
      await expect(bar(page, nextName)).toBeVisible()
    } finally {
      await cancel(request, headers, ids)
    }
  })
})

// F7: the period chosen in the toolbar is the period of the report.
test('asks the report for the chosen days', async ({ page }) => {
  const today = hotelToday()
  const monthStart = `${today.slice(0, 8)}01`
  const nextMonth = new Date(Date.parse(`${monthStart}T00:00:00Z`))
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1)
  const nextMonthStart = nextMonth.toISOString().slice(0, 10)

  const firstReport = page.waitForRequest((r) => r.url().includes('/api/billing/reports/overview'))
  await page.goto('/manage/reports')
  const first = new URL((await firstReport).url())
  // This month of the hotel: the toolbar shows its last day, the API gets the next month's first.
  expect(first.searchParams.get('from')).toBe(monthStart)
  expect(first.searchParams.get('to')).toBe(nextMonthStart)
  await expect(page.getByLabel(en.billing.filter_to, { exact: true })).toHaveValue(
    addDays(nextMonthStart, -1),
  )

  await page.getByLabel(en.billing.filter_from, { exact: true }).fill('2026-03-01')
  const chosen = page.waitForRequest(
    (r) =>
      r.url().includes('/api/billing/reports/overview') &&
      new URL(r.url()).searchParams.get('to') === '2026-04-01',
  )
  await page.getByLabel(en.billing.filter_to, { exact: true }).fill('2026-03-31')
  expect(new URL((await chosen).url()).searchParams.get('from')).toBe('2026-03-01')
  await expect(page.locator('.reports-view .error-message')).toHaveCount(0)
})

test.describe('in another time zone of the browser', () => {
  test.use({ timezoneId: 'America/New_York' })

  test('enters and shows times on the hotel clock with the zone label', async ({
    page,
    request,
  }) => {
    const headers = await owner(request)
    const day = farDate()
    const lastName = runName('Zone')
    const checkIn = hotelMoment(day, '14:00')
    let bookingId = ''
    try {
      await page.goto('/bookings/new')
      await expect(
        page.getByRole('heading', { level: 1, name: en.page_title.booking_new }),
      ).toBeVisible()
      const hotelTimeHint = en.time.hotel_time.replace('{zone}', 'GMT+5')
      await expect(page.getByText(hotelTimeHint).first()).toBeVisible()

      await page.getByLabel(en.fields.last_name).fill(lastName)
      await page.getByLabel(en.fields.first_name).fill('Time')
      await page.getByLabel(en.fields.email).fill(`zone-${Date.now()}@example.test`)
      await page.getByLabel(en.fields.check_in).fill(`${day}T14:00`)
      await page.getByLabel(en.fields.check_out).fill(`${addDays(day, 2)}T12:00`)
      // The hint next to the input gives the entered time on the employee's clock.
      const hint = page.getByText(hotelTimeHint).first()
      await expect
        .poll(async () => spaces(await hint.getAttribute('title')))
        .toBe(spaces(en.time.employee_time.replace('{time}', shownIn(checkIn, 'America/New_York'))))
      const roomType = page.getByLabel(en.fields.room_type)
      const firstRoomType = roomType.locator('option:not([value=""])').first()
      await expect(firstRoomType).toBeAttached()
      await roomType.selectOption((await firstRoomType.getAttribute('value')) ?? '')

      const created = page.waitForResponse(
        (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/bookings',
      )
      await page.getByRole('button', { name: en.common.save, exact: true }).click()
      const response = await created
      expect(response.status()).toBe(201)
      const booking = (await response.json()) as { id: string; stay: { check_in: string } }
      bookingId = booking.id
      expect(booking.stay.check_in).toBe(checkIn)

      // The detail shows the hotel clock with its zone, the employee's time on hover.
      await expect(page).toHaveURL(/\/bookings\/[^/]+\/details$/)
      const shown = page.locator(`time[datetime="${checkIn}"]`).first()
      await expect(shown).toBeVisible()
      expect(spaces(await shown.textContent())).toBe(shownIn(checkIn, HOTEL_ZONE))
      await shown.hover()
      expect(spaces(await shown.getAttribute('title'))).toBe(
        spaces(en.time.employee_time.replace('{time}', shownIn(checkIn, 'America/New_York'))),
      )
    } finally {
      if (bookingId) await cancel(request, headers, [bookingId])
    }
  })

  test('takes today of the grid from the hotel', async ({ page, request }) => {
    await owner(request)
    const today = hotelToday()
    await page.goto(`/?from=${addDays(today, -2)}&to=${addDays(today, 4)}`)

    const head = page.locator('.reservation-grid-head--today')
    await expect(head).toBeVisible()
    const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
      new Date(`${today}T00:00:00Z`),
    )
    await expect(head).toHaveText(`${Number(today.slice(8))}${month}`)
  })
})
