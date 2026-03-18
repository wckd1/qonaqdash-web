/**
 * Normalize API response to { schema, uischema, data } for JsonFormView.
 * Backend may return FormResponse (schema, uischema, data) or plain entity.
 */

/**
 * Build minimal guest form when backend returns plain guest object instead of FormResponse.
 * @param {Record<string, unknown>} guest - e.g. { id, first_name, last_name, email, phone }
 * @returns {{ schema: object, uischema: object, data: object }}
 */
export function guestToForm(guest) {
  const data = {
    firstName: guest.firstName ?? guest.first_name ?? '',
    lastName: guest.lastName ?? guest.last_name ?? '',
    email: guest.email ?? '',
    phone: guest.phone ?? '',
  }
  return {
    schema: {
      type: 'object',
      properties: {
        lastName: { type: 'string', title: 'Last name' },
        firstName: { type: 'string', title: 'First name' },
        phone: { type: 'string', title: 'Phone' },
        email: { type: 'string', title: 'Email', format: 'email' },
      },
    },
    uischema: {
      type: 'Group',
      id: 'main',
      label: 'Details',
      elements: [
        { type: 'Control', scope: '#/properties/lastName', label: 'Last name' },
        { type: 'Control', scope: '#/properties/firstName', label: 'First name' },
        { type: 'Control', scope: '#/properties/phone', label: 'Phone' },
        { type: 'Control', scope: '#/properties/email', label: 'Email' },
      ],
    },
    data,
  }
}

/**
 * @param {Record<string, unknown>} response - API response (FormResponse or plain guest)
 * @returns {{ schema: object, uischema: object, data: object } | null} - null if not enough to render
 */
export function normalizeGuestFormResponse(response) {
  if (!response) return null
  if (response.schema && response.uischema) {
    return {
      schema: response.schema,
      uischema: response.uischema,
      data: response.data ?? {},
    }
  }
  return guestToForm(response)
}

/**
 * @param {Record<string, unknown>} response - API response (FormResponse or flat booking)
 * @returns {{ schema: object, uischema: object, data: object } | null} - null if not form response
 */
export function normalizeBookingFormResponse(response) {
  if (!response?.schema || !response?.uischema) return null
  return {
    schema: response.schema,
    uischema: response.uischema,
    data: response.data ?? {},
  }
}
