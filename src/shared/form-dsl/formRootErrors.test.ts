import { describe, expect, test } from 'vitest'
import type { FormNode } from '@/shared/form-dsl/types'
import { formRootErrors, shownErrorBinds } from '@/shared/form-dsl/formRootErrors'
import { validateFormData } from '@/shared/form-dsl/validateFormData'

/** The shape of the organization booking form: guest and stay groups, rooms as an array. */
const bookingForm = {
  type: 'stack',
  direction: 'vertical',
  children: [
    {
      type: 'group',
      id: 'guest',
      children: [
        {
          type: 'string',
          id: 'last_name',
          bind: 'guest.last_name',
          label: 'fields.last_name',
          rules: { required: true },
        },
        {
          type: 'button',
          id: 'clear',
          label: 'bookings.form_clear_guest_selection',
          actions: [{ type: 'clear_value', bind: 'guest.id' }],
        },
      ],
    },
    {
      type: 'group',
      id: 'stay',
      children: [
        {
          type: 'datetime',
          id: 'check_in',
          bind: 'stay.check_in',
          label: 'fields.check_in',
          rules: { required: true },
        },
        {
          type: 'array',
          id: 'rooms',
          bind: 'stay.rooms',
          label: 'fields.rooms',
          min_items: 2,
          child: {
            type: 'group',
            id: 'room',
            children: [
              {
                type: 'select',
                id: 'room_type',
                bind: 'room_type',
                label: 'fields.room_type',
                items: [],
                rules: { required: true },
              },
            ],
          },
        },
      ],
    },
  ],
} as FormNode

const emptyBooking = {
  guest: { id: null, last_name: '' },
  stay: { check_in: '', rooms: [{ room_type: '' }] },
}

describe('shownErrorBinds', () => {
  test('lists the fields and array row fields the form shows', () => {
    expect([...shownErrorBinds(bookingForm, emptyBooking)].sort()).toEqual([
      'guest.last_name',
      'stay.check_in',
      'stay.rooms.0.room_type',
    ])
  })

  test('shows every field error of the client validation next to its field', () => {
    const { errorsMap } = validateFormData(bookingForm, emptyBooking)
    const shown = shownErrorBinds(bookingForm, emptyBooking)

    const fieldErrors = Object.keys(errorsMap).filter((bind) => bind !== 'stay.rooms')
    expect(fieldErrors.length).toBeGreaterThan(0)
    expect(fieldErrors.filter((bind) => !shown.has(bind))).toEqual([])
  })
})

describe('formRootErrors', () => {
  test('puts an error of the array itself above the form, named by the array label', () => {
    const { errorsMap } = validateFormData(bookingForm, emptyBooking)

    expect(formRootErrors(bookingForm, emptyBooking, errorsMap)).toEqual([
      'Rooms: Must have at least 2 item(s)',
    ])
  })

  test('names a row field the server reports with or without the row', () => {
    const data = { ...emptyBooking, stay: { check_in: '', rooms: [] } }

    expect(
      formRootErrors(bookingForm, data, {
        'stay.rooms.3.room_type': ['required'],
        room_type: ['required'],
      }),
    ).toEqual(['Room type: required'])
  })

  test('shows an error once and form-level errors first', () => {
    expect(
      formRootErrors(bookingForm, emptyBooking, {
        unknown_field: ['Not allowed', 'Not allowed'],
        '': ['Check the form'],
      }),
    ).toEqual(['Check the form', 'Not allowed'])
  })

  test('shows every error above the form without a definition', () => {
    expect(formRootErrors(null, {}, { email: ['Invalid email'] })).toEqual(['Invalid email'])
  })
})
