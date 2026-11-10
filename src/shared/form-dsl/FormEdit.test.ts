import { afterEach, describe, expect, test } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import type { FormNode } from '@/shared/form-dsl/types'

const definition = {
  type: 'stack',
  direction: 'vertical',
  children: [
    {
      type: 'group',
      id: 'main',
      children: [
        { type: 'string', id: 'last_name', bind: 'last_name', label: 'fields.last_name' },
        {
          type: 'string',
          id: 'nickname',
          bind: 'nickname',
          label: 'Nickname',
          visible_when: { bind: 'has_nickname', equals: true },
        },
        {
          type: 'array',
          id: 'rooms',
          bind: 'stay.rooms',
          label: 'fields.rooms',
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
              },
            ],
          },
        },
      ],
    },
  ],
} as FormNode

const data = { last_name: 'Johnson', has_nickname: false, stay: { rooms: [{ room_type: '' }] } }

let wrapper: VueWrapper | undefined

afterEach(() => wrapper?.unmount())

function mountForm(errorsMap: Record<string, string[]>) {
  wrapper = mountWithApp(FormEdit, { props: { definition, data, errorsMap } })
  return wrapper
}

function rootErrors(w: VueWrapper): string {
  const alert = w.find('.form-edit__root-errors')
  return alert.exists() ? alert.text() : ''
}

describe('FormEdit errors', () => {
  test('shows an error of a shown field next to the field only', () => {
    const w = mountForm({ last_name: ['Last name is wrong'] })

    expect(w.find('.form-field-error:not(.form-edit__root-errors)').text()).toBe(
      'Last name is wrong',
    )
    expect(rootErrors(w)).toBe('')
  })

  // F4 (review): Save showed nothing when the server reported a field the form does not show.
  test('shows an error of a field that is not on the form above the form', () => {
    const w = mountForm({ passport_number: ['required'] })

    expect(rootErrors(w)).toBe('required')
  })

  test('names a hidden field whose error is shown above the form', () => {
    const w = mountForm({ nickname: ['required'] })

    expect(rootErrors(w)).toBe('Nickname: required')
  })

  test('names an array row field the server reports without the row', () => {
    const w = mountForm({ room_type: ['required'] })

    expect(rootErrors(w)).toBe('Room type: required')
  })

  test('keeps a form-level error and an error of a row field that is shown', () => {
    const w = mountForm({ '': ['Check the form'], 'stay.rooms.0.room_type': ['required'] })

    expect(rootErrors(w)).toBe('Check the form')
    expect(w.findAll('.form-field-error').map((e) => e.text())).toContain('required')
  })
})
