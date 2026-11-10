/**
 * Generated from docs/openapi.yaml by openapi-typescript. Do not edit by hand:
 * run npm run api:types (npm run contract:sync runs it too).
 */

export interface paths {
  '/api/account': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get account
     * @description Current user account (Bearer + org context). Response includes `permissions`, sourced from the resolved authenticated actor for this request. In `settings`, JSON null means not set.
     *     **Error codes:** iam.user_not_found. Corrupt stored settings may yield 500.
     */
    get: operations['getAccount']
    /**
     * Update account
     * @description Partial merge of `account` and `settings`; omitted top-level keys unchanged (Bearer + org). Response includes the current request actor's `permissions`. Password change: send `currentPassword` and `newPassword`. Per-key JSON null in `settings` clears that key; unknown keys → 400.
     *     **Error codes:** 400 — iam.invalid_email, iam.unknown_setting_key, iam.invalid_setting_value. 401 — iam.current_password_incorrect, iam.current_password_required. 404 — iam.user_not_found. 409 — iam.email_already_in_use.
     */
    put: operations['updateAccount']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/auth/invite/{token}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get invite info
     * @description Validates invite token for the registration UI (no auth).
     *     **Error codes:** 401 — iam.invite_token_expired, iam.invite_token_invalid. 409 — iam.user_already_registered, iam.invite_already_used.
     */
    get: operations['getInvite']
    put?: never
    /**
     * Complete invite registration
     * @description Sets password for the invited user (no auth); returns JWT pair.
     *     **Error codes:** 400 — iam.password_required. 401 — iam.invite_token_expired, iam.invite_token_invalid. 409 — iam.user_already_registered, iam.invite_already_used.
     */
    post: operations['completeInvite']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/auth/login': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * User login
     * @description Email + password (no Bearer); returns JWT pair.
     *     **Error codes:** 400 — iam.email_password_required. 401 — iam.invalid_credentials, iam.registration_not_completed.
     */
    post: operations['loginUser']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/auth/refresh': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Refresh session
     * @description Body: `refresh_token` (JWT with `token_use=refresh`). No Bearer access token on this route. Org/hotel on the new tokens come from the employee record.
     *     **Error codes:** 400 — iam.refresh_token_required. 401 — iam.refresh_token_expired, iam.refresh_token_invalid.
     */
    post: operations['refreshSession']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/bookings/{bookingId}/adjustments': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Add manual adjustment
     * @description Appends a manual charge (positive amount) or credit (negative amount) to the open guest bill. The bill must exist and be open.
     *     **Error codes:** common.invalid_booking_id; billing.bill_not_found; billing.bill_closed; billing.amount_required; billing.description_required.
     */
    post: operations['addManualAdjustment']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/bookings/{bookingId}/balance': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get booking balance
     * @description Returns the aggregate balance for a booking. This works both pre-check-in (deposits only) and post-check-in (full bill). `has_bill` indicates whether a guest bill exists.
     *     **Error codes:** common.invalid_booking_id.
     */
    get: operations['getBookingBalance']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/bookings/{bookingId}/bill': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get guest bill
     * @description Returns the guest bill header, all ledger entries, and the outstanding balance for the specified booking. Returns 404 if no bill exists (bill opens at check-in).
     *     **Error codes:** common.invalid_booking_id; billing.bill_not_found.
     */
    get: operations['getBill']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/bookings/{bookingId}/bill/close': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Close guest bill
     * @description Closes the open guest bill for the specified booking. A closed bill is read-only. May be closed with a non-zero balance (outstanding debt).
     *     **Error codes:** common.invalid_booking_id; billing.bill_not_found; billing.bill_closed.
     */
    put: operations['closeBill']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/bookings/{bookingId}/payments': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Record payment
     * @description Records a payment against the booking. If a guest bill exists, the entry is attached to it. If no bill exists yet (pre-check-in), the entry is stored as a deposit with no bill reference and will be backfilled at check-in.
     *     **Error codes:** common.invalid_booking_id; billing.invalid_amount; billing.bill_closed.
     */
    post: operations['recordPayment']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/bookings/{bookingId}/refunds': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Record refund
     * @description Records a refund that reverses a prior payment. The referenced payment must exist, belong to the same booking, and be of type `payment`. Refund amount is stored as positive balance_delta (increases what guest owes).
     *     **Error codes:** common.invalid_booking_id; billing.invalid_amount; billing.payment_not_found; billing.not_a_payment; billing.bill_closed.
     */
    post: operations['recordRefund']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/reports/ledger': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List ledger entries
     * @description Returns a paginated, filterable list of all ledger entries for the current hotel. Supports multiple entry_type values (comma-separated).
     *     **Error codes:** common.invalid_date_range.
     */
    get: operations['listLedgerEntries']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/reports/ledger/daily': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Daily breakdown
     * @description Returns charges, payments, refunds, and net totals grouped by day for the current hotel within the specified date range. Supports multi-value entry_type filter (comma-separated).
     *     **Error codes:** common.invalid_date_range.
     */
    get: operations['getDailyBreakdown']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/reports/ledger/monthly': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Monthly breakdown
     * @description Returns charges, payments, refunds, and net totals grouped by month for the current hotel within the specified date range. Supports multi-value entry_type filter (comma-separated).
     *     **Error codes:** common.invalid_date_range.
     */
    get: operations['getMonthlyBreakdown']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/reports/outstanding': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Outstanding balances
     * @description Returns all open guest bills with non-zero outstanding balances for the current hotel, plus the total outstanding amount.
     */
    get: operations['getOutstandingBalances']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/billing/reports/overview': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Financial overview
     * @description Returns aggregated revenue breakdown (accommodation, adjustments, service charges), payments, refunds, corrections, net balance, and current total outstanding for the hotel.
     *     **Error codes:** common.invalid_date_range.
     */
    get: operations['getFinancialOverview']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/bookings': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List bookings
     * @description Distinct bookings (read model). Optional `q` on guest name. With `from`+`to` (`YYYY-MM-DD`, UTC midnight): `check_out >= from` **and** `check_in <= to`.
     *     **Error codes:** booking.grid_invalid_from_date, booking.grid_invalid_to_date, booking.grid_from_before_to.
     */
    get: operations['listBookings']
    put?: never
    /**
     * Create booking
     * @description Flat `{ guest, stay, adjustments? }` JSON (see `CreateBookingRequest`). Optional top-level `adjustments` are manual pricing inputs forwarded to Pricing (not persisted on the booking stream). Room availability is checked twice before commit and the DB rejects overlapping active assignments for the same physical room, so concurrent creates (e.g. OTA + front desk) cannot double-book. `guest.id` links an existing profile; omit to create inline.
     *     **Error codes:** booking.invalid_data_format, booking.dates_required, booking.rooms_required, booking.room_type_required_each_room, booking.form_missing_stay_group, booking.guest_information_required; booking.overbooking; **409** `guest.duplicate` when inline guest creation hits an existing profile; **422** `common.validation_failed` with `error.issues[]` when payload fails org booking form `rules` (stay subtree and array rows) or inline guest constraints (e.g. `guest.email` / `guest.phone` `validation.contact_required`).
     */
    post: operations['createBooking']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/bookings/{id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get booking by id
     * @description Unified booking data from the aggregate. `stay.rooms[]` may include `room_type_label` and `room_id_label`. **`_form`** carries canonical form id (`booking`) and **hash**. Merge with GET `/api/bookings/form?target=view` definition on the client. Pricing data (accommodation snapshot, manual adjustments) is served by the pricing module via `GET /api/pricing/bookings/{id}/quote`. Once the booking is `checked_in` or `checked_out` the response also carries `outstanding_balance` (zero when fully paid, omitted before check-in).
     *     **Error codes:** common.invalid_booking_id; booking.not_found.
     */
    get: operations['getBooking']
    /**
     * Update booking
     * @description Dates, rooms, and form data when status is `confirmed` or `checked_in`; overbooking re-checked and stream + grid persist atomically with the same room-overlap DB guard as create. Optional top-level `adjustments` are manual pricing inputs forwarded to Pricing (not persisted on the booking stream). `version` in the response is the stream after save — not read from the request body.
     *     **Error codes:** common.invalid_booking_id; booking.invalid_data_format, booking.dates_required, booking.rooms_required, booking.room_type_required_each_room, booking.form_missing_stay_group, booking.guest_information_required; booking.not_found; booking.overbooking, booking.concurrent_modification; booking.invalid_status_transition; **422** `common.validation_failed` with `error.issues[]` when payload fails org booking form `rules`.
     */
    put: operations['updateBooking']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/bookings/{id}/cancel': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Cancel booking
     * @description Status: `confirmed` → `canceled`.
     *     **Error codes:** common.invalid_booking_id; booking.not_found; booking.invalid_status_transition.
     */
    put: operations['cancelBooking']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/bookings/{id}/check-in': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Check in
     * @description Status: `confirmed` → `checked_in`. Response includes `outstanding_balance` reflecting the bill pricing opens on check-in.
     *     **Error codes:** common.invalid_booking_id; booking.not_found; booking.invalid_status_transition.
     */
    put: operations['checkInBooking']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/bookings/{id}/check-out': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Check out
     * @description Status: `checked_in` → `checked_out`.
     *     If the bill has an outstanding balance, returns 409 with `booking.outstanding_balance`
     *     error that includes the `outstanding_balance` field.
     *     Send `{"force_unpaid": true}` to allow check-out without full payment;
     *     in that case the bill stays open so the debt remains visible.
     *     When balance ≤ 0 (fully paid), the bill is auto-closed on check-out.
     *     **Error codes:** common.invalid_booking_id; booking.not_found; booking.invalid_status_transition; booking.check_in_required_before_check_out; booking.outstanding_balance.
     */
    put: operations['checkOutBooking']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/bookings/form': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get booking form (runtime)
     * @description Use **target=edit** when creating a new booking (default). Use **target=view** when displaying an existing booking with data from GET …/bookings/{id}. Omit **target** → **edit**. Requires org **and** hotel in JWT.
     */
    get: operations['getBookingForm']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/bookings/form/definition': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get booking form definition (editor)
     * @description Persisted editor FormDSL only (no runtime merges). Org JWT required; hotel claim not required.
     */
    get: operations['getBookingFormDefinition']
    /**
     * Update booking form definition (editor)
     * @description Saves org booking FormDSL definition. Validates core stay group. Triggers compilation of view/edit forms.
     *     **Error codes:** booking.invalid_data_format, booking.form_missing_stay_group; common.definition_required.
     */
    put: operations['updateBookingFormDefinition']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/bookings/grid': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get reservation grid
     * @description Bookings in the date range with rooms nested under `stay.rooms[]`. Overlap: `check_in <= to` and `check_out >= from` (dates `YYYY-MM-DD`, UTC midnight). `from` and `to` required.
     *     **Error codes:** booking.grid_from_to_required, booking.grid_invalid_from_date, booking.grid_invalid_to_date, booking.grid_from_before_to.
     */
    get: operations['getReservationGrid']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/employees': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List employees
     * @description Relational list only; full form data comes from GET `/api/employees/{employee_id}`.
     */
    get: operations['listEmployees']
    put?: never
    /**
     * Create employee
     * @description Raw form `data` per org employee schema; linked to the current JWT hotel by default.
     *     **Error codes:** iam.invalid_email, iam.first_name_required, iam.last_name_required, iam.invalid_data_format; **422** `common.validation_failed` when payload fails org employee form `rules`.
     */
    post: operations['createEmployee']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/employees/{employee_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get employee
     * @description Flat profile JSON matching the org employee schema, with linked occupations, sparse permission overrides, effective permissions, and `_form` metadata.
     *     **Error codes:** common.invalid_employee_id; iam.employee_not_found.
     */
    get: operations['getEmployee']
    /**
     * Update employee
     * @description Flat `data` same as POST.
     *     **Error codes:** common.invalid_employee_id; iam.invalid_email, iam.first_name_required, iam.last_name_required, iam.invalid_data_format; iam.employee_not_found; **422** `common.validation_failed` when payload fails org employee form `rules`.
     */
    put: operations['updateEmployee']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/employees/{employee_id}/occupations': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Replace employee occupations
     * @description Replaces all occupation links for the employee with the provided `occupation_ids`.
     */
    put: operations['replaceEmployeeOccupations']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/employees/{employee_id}/permissions': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Replace employee permission overrides
     * @description Replaces the `permission_overrides` document on the employee's primary hotel link. Effective permissions are computed as `override if present else merged occupation base`. The primary hotel link is `employee.hotel_id` when set, otherwise the first linked hotel.
     */
    put: operations['replaceEmployeePermissions']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/employees/form': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get employee form (runtime)
     * @description Compiled org employee FormDSL. Omit `target` → `edit`.
     */
    get: operations['getEmployeeForm']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/employees/form/definition': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get employee form definition (editor)
     * @description Persisted editor FormDSL for employees; round-trips with PUT `/api/employees/form/definition`.
     */
    get: operations['getEmployeeFormDefinition']
    /**
     * Update employee form definition (editor)
     * @description Saves org employee FormDSL definition. Validates core fields and `main` group (first_name, last_name, email).
     *     **Error codes:** iam.form_missing_core; common.definition_required.
     */
    put: operations['updateEmployeeFormDefinition']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/guests': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List guests
     * @description Relational list only (`GuestListItem`); `q` filters name/email/phone. Blocked guests are included with `blocked: true`.
     */
    get: operations['listGuests']
    put?: never
    /**
     * Create guest
     * @description Flat form `data` per org schema; relational columns extracted server-side.
     *     **Error codes:** guest.invalid_data_format, guest.contact_required, guest.first_name_required, guest.last_name_required; **422** `common.validation_failed` with `error.issues[]` when payload fails org form `rules` (see OpenAPI `APIError`).
     */
    post: operations['createGuest']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/guests/{id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get guest
     * @description Flat profile JSON matching the org guest schema.
     *     **Error codes:** common.invalid_guest_id; guest.not_found.
     */
    get: operations['getGuest']
    /**
     * Update guest
     * @description Flat `data` same as POST; relational columns re-extracted.
     *     **Error codes:** common.invalid_guest_id; guest.invalid_data_format, guest.contact_required, guest.first_name_required, guest.last_name_required; guest.not_found; **422** `common.validation_failed` with `error.issues[]` when payload fails org form `rules`.
     */
    put: operations['updateGuest']
    post?: never
    /**
     * Block guest
     * @description Blocks a guest (marks `blocked_at`). Blocked guests remain visible in list and detail responses with `blocked: true`. Missing guest → 404.
     *     **Error codes:** common.invalid_guest_id; guest.not_found.
     */
    delete: operations['blockGuest']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/guests/{id}/bookings': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List bookings by guest
     * @description Bookings for CRM “previous stays”; same item shape as GET `/api/bookings` (empty array if none).
     *     **Error codes:** common.invalid_guest_id.
     */
    get: operations['listGuestBookings']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/guests/form': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get guest form (runtime)
     * @description Compiled org guest FormDSL. Omit `target` → `edit`.
     */
    get: operations['getGuestForm']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/guests/form/definition': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get guest form definition (editor)
     * @description Persisted editor FormDSL (no normalization); round-trips with PUT `/api/guests/form/definition`.
     */
    get: operations['getGuestFormDefinition']
    /**
     * Update guest form definition (editor)
     * @description Saves org guest FormDSL definition. Validates core fields and `main` group (firstName, lastName, phone, email). Triggers compilation of view/edit forms.
     *     **Error codes:** guest.form_missing_core; common.definition_required.
     */
    put: operations['updateGuestFormDefinition']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/internal/provision': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Provision a new organization
     * @description Internal bootstrap: creates organization, hotel, user, and employee in one transaction. Requires `Secret-Key` header (not Bearer auth). `user_first_name`/`user_last_name` seed the auth user and are copied once into the created employee profile (no further sync).
     *     **Error codes:** 400 — iam.provision_fields_required. 401 — iam.secret_key_missing, iam.secret_key_invalid. 409 — iam.provision_conflict.
     */
    post: operations['provisionOrganization']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/occupations': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List occupation templates
     * @description Returns every allowed occupation role family as a stable machine key plus frontend i18n key, with current occupation templates grouped under each role. Empty role groups are included so clients do not need to guess valid `role_key` values for create/update flows.
     */
    get: operations['listOccupations']
    put?: never
    /**
     * Create occupation template
     * @description Creates a new occupation template with default permissions.
     */
    post: operations['createOccupation']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/occupations/{occupation_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get occupation template
     * @description Returns one occupation template by id.
     */
    get: operations['getOccupation']
    /**
     * Update occupation template
     * @description Updates title, role, and default permissions for an occupation template.
     */
    put: operations['updateOccupation']
    post?: never
    /**
     * Delete occupation template
     * @description Deletes an occupation template by id.
     */
    delete: operations['deleteOccupation']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/pricing/base-rates': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get base rates
     * @description Returns base rate (minor currency units) for each active room type in the hotel.
     */
    get: operations['getBaseRates']
    /**
     * Update base rates
     * @description Bulk update nightly base rates for room types. Each item must reference a valid room type in this hotel. `base_rate_minor` must be ≥ 0.
     *     **Error codes:** pricing.invalid_base_rate (negative value); pricing.room_type_not_found (unknown room type id in array).
     */
    put: operations['updateBaseRates']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/pricing/bookings/{bookingId}/quote': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get booking quote
     * @description Returns the stored accommodation snapshot (pricing breakdown + manual adjustments) for a booking. Use `manual_adjustments` for round-tripping on updates. Returns 404 if no quote has been calculated yet.
     *     **Error codes:** common.invalid_booking_id; pricing.not_found.
     */
    get: operations['getBookingQuote']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/pricing/conditions': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get pricing condition candidates
     * @description Returns indexed form fields eligible as pricing rule conditions. A synthetic **`room_type`** select (bind `room_type`) is always prepended first with this hotel’s room types plus an “any” option (same source as the booking form runtime). Remaining rows come from the org index (saved at booking form save time). **`hash` / `ETag`** reflect the stored index only (not the live room-type list). Hotel scope required (same JWT as other pricing routes).
     */
    get: operations['getPricingConditions']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/pricing/quote': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Calculate stay quote
     * @description Returns a night-by-night pricing breakdown with base rates and rule adjustments for the given stay parameters. Property conditions are evaluated against `booking_data` using the current booking form metadata. Only `active` rules are applied; `disabled` and `invalid` rules are skipped.
     *     **Evaluation order:** per-night rules (compound, priority order) → sum nights → total-scope rules (compound, priority order). Rounding: ROUND_HALF_UP after each rule.
     */
    post: operations['calculateQuote']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/pricing/rules': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List pricing rules
     * @description All rules for the JWT hotel, ordered by priority ascending (lowest = highest precedence first).
     */
    get: operations['listPricingRules']
    put?: never
    /**
     * Create pricing rule
     * @description A pricing rule combines typed conditions (property field match, specific date, date range) with an effect (percent or fixed adjustment, per-night or total scope). `priority` is a unique positive integer per hotel (lower = higher precedence). `status` defaults to `active` when omitted; only `active` and `disabled` are accepted on write. Property condition operators: `eq` (equals), `not_eq` (not equals); both use `value`. Property conditions are validated against the current booking form condition index; referencing a deleted field or removed select option is rejected.
     *     **Error codes:** pricing.pricing_rule_name_required, pricing.pricing_rule_priority_required, pricing.pricing_rule_invalid_status; pricing.pricing_rule_invalid_condition, pricing.pricing_rule_invalid_effect_type, pricing.pricing_rule_invalid_apply_to, pricing.pricing_rule_invalid_date_range; pricing.pricing_rule_condition_field_not_found, pricing.pricing_rule_condition_value_not_found; pricing.pricing_rule_priority_taken.
     */
    post: operations['createPricingRule']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/pricing/rules/{id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get pricing rule
     * @description One pricing rule by id.
     *     **Error codes:** common.invalid_pricing_rule_id; pricing.pricing_rule_not_found.
     */
    get: operations['getPricingRule']
    /**
     * Update pricing rule
     * @description Update name, priority, status, conditions, and effect. Priority must remain unique per hotel. Only `active` and `disabled` are accepted for `status` on write; `invalid` is server-managed. Updating a previously `invalid` rule with valid conditions clears `invalid_reason` and restores the requested status.
     *     **Error codes:** common.invalid_pricing_rule_id, pricing.pricing_rule_name_required, pricing.pricing_rule_priority_required, pricing.pricing_rule_invalid_status; pricing.pricing_rule_invalid_condition, pricing.pricing_rule_invalid_effect_type, pricing.pricing_rule_invalid_apply_to, pricing.pricing_rule_invalid_date_range; pricing.pricing_rule_condition_field_not_found, pricing.pricing_rule_condition_value_not_found; pricing.pricing_rule_not_found; pricing.pricing_rule_priority_taken.
     */
    put: operations['updatePricingRule']
    post?: never
    /**
     * Delete pricing rule
     * @description Hard-delete a pricing rule.
     *     **Error codes:** common.invalid_pricing_rule_id; pricing.pricing_rule_not_found.
     */
    delete: operations['deletePricingRule']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/hotel': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get hotel profile
     * @description Hotel from JWT (org + hotel scope). Includes the hotel's default `currency` (ISO 4217 alpha-3).
     *     **Error codes:** property.hotel_not_found.
     */
    get: operations['getHotel']
    /**
     * Update hotel profile
     * @description `name` and `currency` required; name trimmed server-side.
     *     **Error codes:** property.hotel_name_required, property.hotel_invalid_currency; property.hotel_not_found.
     */
    put: operations['updateHotel']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/room-types': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List room types
     * @description `q` matches type name, description, or any room number under that type (substring).
     */
    get: operations['listRoomTypes']
    put?: never
    /**
     * Create room type
     * @description New room type for the JWT hotel. Base rate is managed separately under `/api/property/pricing/base-rates`.
     *     **Error codes:** property.room_type_name_required; property.room_type_already_exists.
     */
    post: operations['createRoomType']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/room-types/{id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Update room type
     * @description Name and optional description. Base rate is managed separately under `/api/property/pricing/base-rates`.
     *     **Error codes:** common.invalid_room_type_id; property.room_type_name_required; property.room_type_not_found; property.room_type_already_exists.
     */
    put: operations['updateRoomType']
    post?: never
    /**
     * Delete room type
     * @description Soft-delete only when no active rooms of that type; past bookings still resolve labels by id.
     *     **Error codes:** common.invalid_room_type_id; property.room_type_not_found; property.room_type_in_use.
     */
    delete: operations['deleteRoomType']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/rooms': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List rooms
     * @description Optional `q` filters by room number (case-insensitive substring).
     */
    get: operations['listRooms']
    put?: never
    /**
     * Create room
     * @description Physical room under the JWT hotel.
     *     **Error codes:** property.room_type_id_required, property.room_number_required; property.room_type_not_found; property.room_already_exists.
     */
    post: operations['createRoom']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/rooms/{id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get room
     * @description One room by id (org data, JWT hotel for auth).
     *     **Error codes:** common.invalid_room_id; property.room_not_found.
     */
    get: operations['getRoom']
    /**
     * Update room
     * @description Room type and number. New `room_type_id` must be in the same hotel. Operational axes are updated via PUT /api/property/rooms/{id}/housekeeping and /maintenance.
     *     **Error codes:** common.invalid_room_id; property.room_type_id_required, property.room_number_required; property.room_not_found, property.room_type_not_found; property.room_already_exists.
     */
    put: operations['updateRoom']
    post?: never
    /**
     * Delete room
     * @description Soft-delete; omitted from list/availability but still readable by id for historical bookings.
     *     **Error codes:** common.invalid_room_id; property.room_not_found.
     */
    delete: operations['deleteRoom']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/rooms/{id}/activity': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get room activity
     * @description Append-only room events (availability / housekeeping / maintenance changes) with actor-attributable metadata.
     *     **Error codes:** common.invalid_room_id; property.room_not_found.
     */
    get: operations['listRoomActivity']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/rooms/{id}/availability': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Change room availability
     * @description Sets the **availability** axis. `ooo` removes the room from availability; `available` releases the block.
     *     **Error codes:** common.invalid_room_id, property.invalid_availability_status; property.room_not_found; property.concurrency_conflict.
     */
    put: operations['changeRoomAvailability']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/rooms/{id}/housekeeping': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Change room housekeeping status
     * @description Alias for housekeeping task management. Each status maps to the corresponding task transition on the room's open housekeeping task (or creates one when needed). Typical flow: `dirty → cleaning → inspection → clean`.
     *     **Error codes:** common.invalid_room_id, tasks.invalid_status, tasks.invalid_transition, tasks.duplicate_open_task, tasks.task_not_found, tasks.concurrency_conflict.
     */
    put: operations['changeRoomHousekeeping']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/rooms/{id}/maintenance': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Change room maintenance status
     * @description Alias for maintenance task management. `required` and `under_maintenance` require `planned_end` on first use (create/start).
     *     **Error codes:** common.invalid_room_id, tasks.invalid_status, tasks.invalid_transition, tasks.planned_end_required, tasks.duplicate_open_task, tasks.task_not_found.
     */
    put: operations['changeRoomMaintenance']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/property/rooms/available': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List available rooms
     * @description Room picker: omit `from`/`to` for all rooms. With `from`+`to` (`dd.MM.yyyy`), only rooms free in that range. With `exclude` (booking UUID) and a range, that booking’s occupancy is ignored so its rooms stay selectable.
     *     **Error codes:** property.list_from_to_both_or_neither, property.list_invalid_from_date, property.list_invalid_to_date, property.list_to_before_from, property.list_invalid_exclude_booking_id.
     */
    get: operations['listAvailableRooms']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/tasks/housekeeping': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List housekeeping tasks
     * @description **Error codes:** tasks.invalid_status; common.invalid_room_id, common.invalid_employee_id.
     */
    get: operations['listHousekeepingTasks']
    put?: never
    /**
     * Create housekeeping task
     * @description Creates an open housekeeping task. Fails with `tasks.duplicate_open_task` if a non-terminal task already exists for the room.
     *     **Error codes:** tasks.room_id_required, tasks.duplicate_open_task.
     */
    post: operations['createHousekeepingTask']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/tasks/housekeeping/{id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get housekeeping task */
    get: operations['getHousekeepingTask']
    /**
     * Update housekeeping task
     * @description Partial update. Omitted fields stay unchanged. `assignee_employee_id: null` clears the assignee.
     */
    put: operations['updateHousekeepingTask']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/tasks/housekeeping/{id}/status': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Change housekeeping task status
     * @description Valid transitions: open → in_progress, in_progress → inspection, inspection → done; any non-terminal → canceled.
     */
    put: operations['changeHousekeepingTaskStatus']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/tasks/maintenance': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List maintenance tasks
     * @description **Error codes:** tasks.invalid_status; common.invalid_room_id, common.invalid_employee_id.
     */
    get: operations['listMaintenanceTasks']
    put?: never
    /**
     * Create maintenance task
     * @description Requires `planned_end`. Fails with `tasks.duplicate_open_task` if a non-terminal task already exists for the room.
     *     **Error codes:** tasks.room_id_required, tasks.planned_end_required, tasks.duplicate_open_task.
     */
    post: operations['createMaintenanceTask']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/tasks/maintenance/{id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get maintenance task */
    get: operations['getMaintenanceTask']
    /**
     * Update maintenance task
     * @description Partial update. Omitted fields stay unchanged. `assignee_employee_id: null` clears the assignee; `planned_end: null` clears the date.
     *     While the task is in_progress, `planned_end`/`description` edits propagate to the room's maintenance state.
     */
    put: operations['updateMaintenanceTask']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/api/tasks/maintenance/{id}/status': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Change maintenance task status
     * @description Valid transitions: open → in_progress, in_progress → done; any non-terminal → canceled.
     */
    put: operations['changeMaintenanceTaskStatus']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    'billinghttp.AdjustmentRequest': {
      /** @example 5000 */
      amount: number
      /** @example Late checkout fee */
      description: string
    }
    'billinghttp.AdjustmentResponse': {
      entry: components['schemas']['billinghttp.EntryDTO']
      /** @example 55000 */
      outstanding_balance: number
    }
    'billinghttp.BillHeader': {
      /** @example 550e8400-e29b-41d4-a716-446655440050 */
      booking_id: string
      /**
       * Format: date-time
       * @example 2026-03-17T12:00:00Z
       */
      closed_at?: string
      /** @example 550e8400-e29b-41d4-a716-446655440030 */
      guest_id?: string
      /** @example 550e8400-e29b-41d4-a716-446655440070 */
      id: string
      /**
       * Format: date-time
       * @example 2026-03-15T14:00:00Z
       */
      opened_at: string
      /**
       * @example open
       * @enum {string}
       */
      status: 'open' | 'closed'
    }
    'billinghttp.BillResponse': {
      bill: components['schemas']['billinghttp.BillHeader']
      entries: components['schemas']['billinghttp.EntryDTO'][]
      /** @example 50000 */
      outstanding_balance: number
    }
    'billinghttp.BookingBalanceResponse': {
      /** @example -5000 */
      balance: number
      /** @example false */
      has_bill: boolean
    }
    'billinghttp.CloseBillResponse': {
      bill: components['schemas']['billinghttp.BillHeader']
    }
    'billinghttp.DailyBreakdownResponse': {
      days: components['schemas']['billinghttp.DailyBreakdownRow'][]
      period: components['schemas']['billinghttp.PeriodDTO']
    }
    'billinghttp.DailyBreakdownRow': {
      /** @example 85000 */
      charges: number
      /** @example 2026-03-15 */
      date: string
      /** @example 12 */
      entries_count: number
      /** @example 30000 */
      net: number
      /** @example -60000 */
      payments: number
      /** @example 5000 */
      refunds: number
    }
    'billinghttp.EntryDTO': {
      /** @example 10000 */
      balance_delta: number
      /**
       * Format: date-time
       * @example 2026-03-15T14:00:00Z
       */
      created_at: string
      /** @example Night 2026-03-15 */
      description: string
      /**
       * @example accommodation_night
       * @enum {string}
       */
      entry_type:
        | 'accommodation_night'
        | 'rule_adjustment'
        | 'manual_adjustment'
        | 'system_adjustment'
        | 'service_charge'
        | 'payment'
        | 'refund'
        | 'accommodation_correction'
        | 'correction'
      /** @example 550e8400-e29b-41d4-a716-446655440080 */
      id: string
      /** @description free-form, depends on entry_type */
      metadata: {
        [key: string]: unknown
      }
    }
    'billinghttp.LedgerEntryDTO': {
      /** @example 10000 */
      balance_delta: number
      /** @example 550e8400-e29b-41d4-a716-446655440050 */
      booking_id: string
      /**
       * Format: date-time
       * @example 2026-03-15T14:00:00Z
       */
      created_at: string
      /** @example Night 2026-03-15 */
      description: string
      /**
       * @example accommodation_night
       * @enum {string}
       */
      entry_type:
        | 'accommodation_night'
        | 'rule_adjustment'
        | 'manual_adjustment'
        | 'system_adjustment'
        | 'service_charge'
        | 'payment'
        | 'refund'
        | 'accommodation_correction'
        | 'correction'
      /** @example 550e8400-e29b-41d4-a716-446655440080 */
      id: string
      /** @description free-form, depends on entry_type */
      metadata: {
        [key: string]: unknown
      }
    }
    'billinghttp.LedgerListResponse': {
      entries: components['schemas']['billinghttp.LedgerEntryDTO'][]
    }
    'billinghttp.MonthlyBreakdownResponse': {
      months: components['schemas']['billinghttp.MonthlyBreakdownRow'][]
      period: components['schemas']['billinghttp.PeriodDTO']
    }
    'billinghttp.MonthlyBreakdownRow': {
      /** @example 850000 */
      charges: number
      /** @example 120 */
      entries_count: number
      /** @example 2026-03 */
      month: string
      /** @example 300000 */
      net: number
      /** @example -600000 */
      payments: number
      /** @example 50000 */
      refunds: number
    }
    'billinghttp.OutstandingBalancesResponse': {
      bills: components['schemas']['billinghttp.OutstandingBillDTO'][]
      /** @example 150000 */
      total_outstanding: number
    }
    'billinghttp.OutstandingBillDTO': {
      /** @example 550e8400-e29b-41d4-a716-446655440070 */
      bill_id: string
      /** @example 550e8400-e29b-41d4-a716-446655440050 */
      booking_id: string
      /** @example 550e8400-e29b-41d4-a716-446655440030 */
      guest_id?: string
      /**
       * Format: date-time
       * @example 2026-03-15T14:00:00Z
       */
      opened_at: string
      /** @example 20000 */
      outstanding: number
      /**
       * @example open
       * @enum {string}
       */
      status: 'open' | 'closed'
      /** @example 50000 */
      total_charges: number
      /** @example -30000 */
      total_payments: number
    }
    'billinghttp.OverviewResponse': {
      /** @example 1250000 */
      accommodation: number
      /** @example -5000 */
      corrections: number
      /** @example 30000 */
      manual_adjustments: number
      /** @example -1100000 */
      payments: number
      period: components['schemas']['billinghttp.PeriodDTO']
      /** @example 50000 */
      refunds: number
      /** @example -75000 */
      rule_adjustments: number
      /** @example 0 */
      service_charges: number
      /** @example 1205000 */
      total_charges: number
      /** @example 85000 */
      total_outstanding: number
    }
    'billinghttp.PaymentRequest': {
      /** @example 15000 */
      amount: number
      /** @example Full payment */
      description?: string
    }
    'billinghttp.PaymentResponse': {
      /** @example 0 */
      balance: number
      entry: components['schemas']['billinghttp.EntryDTO']
    }
    'billinghttp.PeriodDTO': {
      /** @example 2026-03-01 */
      from: string
      /** @example 2026-03-31 */
      to: string
    }
    'billinghttp.RefundRequest': {
      /** @example 5000 */
      amount: number
      /** @example Partial refund */
      description?: string
      /**
       * Format: uuid
       * @example 550e8400-e29b-41d4-a716-446655440080
       */
      reverses_entry_id: string
    }
    'billinghttp.RefundResponse': {
      /** @example 5000 */
      balance: number
      entry: components['schemas']['billinghttp.EntryDTO']
    }
    'bookinghttp.BookingAdjustmentEffect': {
      /**
       * @example total
       * @enum {string}
       */
      apply_to?: 'per_night' | 'total'
      /**
       * @example percent
       * @enum {string}
       */
      type?: 'percent' | 'fixed'
      /** @example -1000 */
      value?: number
    }
    'bookinghttp.BookingGuestInfo': {
      /** @example john@example.com */
      email?: string
      /** @example John */
      first_name?: string
      /**
       * Format: uuid
       * @example 550e8400-e29b-41d4-a716-446655440030
       */
      id?: string
      /** @example Doe */
      last_name?: string
      /** @example +77001234567 */
      phone?: string
    }
    'bookinghttp.BookingGuestInput': {
      /** @example john@example.com */
      email?: string | null
      /** @example John */
      first_name?: string
      /**
       * Format: uuid
       * @example 550e8400-e29b-41d4-a716-446655440030
       */
      id?: string | null
      /** @example Doe */
      last_name?: string
      /** @example +77001234567 */
      phone?: string | null
    }
    'bookinghttp.BookingItem': {
      /** @description detail (GET /api/bookings/{id}) only */
      _form?: components['schemas']['bookinghttp.FormRef']
      guest?: components['schemas']['bookinghttp.BookingGuestInfo']
      /** @example 550e8400-e29b-41d4-a716-446655440050 */
      id: string
      /** @example 15000 */
      outstanding_balance?: number
      /**
       * @example confirmed
       * @enum {string}
       */
      status: 'confirmed' | 'checked_in' | 'checked_out' | 'canceled'
      stay: components['schemas']['bookinghttp.BookingStayData']
    }
    'bookinghttp.BookingManualAdjustmentInput': {
      effect?: components['schemas']['bookinghttp.BookingAdjustmentEffect']
      /** @example Campaign winner */
      name?: string
    }
    'bookinghttp.BookingRoomData': {
      /**
       * Format: uuid
       * @example 550e8400-e29b-41d4-a716-446655440020
       */
      room_id?: string
      /** @example 101 */
      room_id_label?: string
      /**
       * Format: uuid
       * @example 550e8400-e29b-41d4-a716-446655440010
       */
      room_type: string
      /** @example Standard Double */
      room_type_label?: string
    }
    'bookinghttp.BookingRoomInput': {
      /**
       * Format: uuid
       * @example 550e8400-e29b-41d4-a716-446655440020
       */
      room_id?: string | null
      /**
       * Format: uuid
       * @example 550e8400-e29b-41d4-a716-446655440010
       */
      room_type: string
    }
    'bookinghttp.BookingStayData': {
      /**
       * Format: date-time
       * @example 2026-03-15T14:00:00Z
       */
      check_in: string
      /**
       * Format: date-time
       * @example 2026-03-17T12:00:00Z
       */
      check_out: string
      /** @description omitted in list items */
      rooms?: components['schemas']['bookinghttp.BookingRoomData'][]
    }
    'bookinghttp.BookingStayInput': {
      /**
       * Format: date-time
       * @description RFC3339
       * @example 2026-03-15T14:00:00Z
       */
      check_in: string
      /**
       * Format: date-time
       * @description RFC3339, after check_in
       * @example 2026-03-17T12:00:00Z
       */
      check_out: string
      rooms: components['schemas']['bookinghttp.BookingRoomInput'][]
    }
    'bookinghttp.CheckOutRequest': {
      /** @example false */
      force_unpaid?: boolean
    }
    'bookinghttp.CreateBookingRequest': {
      adjustments?: components['schemas']['bookinghttp.BookingManualAdjustmentInput'][] | null
      guest: components['schemas']['bookinghttp.BookingGuestInput']
      stay: components['schemas']['bookinghttp.BookingStayInput']
    }
    'bookinghttp.FormRef': {
      /** @example a94f2c1e5b */
      hash: string
      /** @example booking */
      id: string
    }
    'bookinghttp.FormResponse': {
      /** @description FormDSL definition tree */
      definition: {
        [key: string]: unknown
      }
      /**
       * @description always set: content hash of the definition
       * @example a94f2c1e5b
       */
      hash: string
    }
    'bookinghttp.OutstandingBalanceError': {
      /** @example booking.outstanding_balance */
      code: string
      /** @example booking has an outstanding balance */
      message: string
      /** @example 15000 */
      outstanding_balance: number
    }
    'bookinghttp.OutstandingBalanceErrorResponse': {
      error: components['schemas']['bookinghttp.OutstandingBalanceError']
    }
    'bookinghttp.UpdateBookingRequest': {
      adjustments?: components['schemas']['bookinghttp.BookingManualAdjustmentInput'][] | null
      guest?: components['schemas']['bookinghttp.BookingGuestInput']
      stay: components['schemas']['bookinghttp.BookingStayInput']
    }
    'bookinghttp.UpdateFormRequest': {
      /** @description FormDSL definition tree */
      definition: {
        [key: string]: unknown
      }
    }
    /** @enum {string} */
    'domain.AdjustmentSource': 'rule' | 'manual' | 'system'
    /** @enum {string} */
    'domain.ApplyTo': 'per_night' | 'total'
    /** @enum {string} */
    'domain.ConditionType': 'property' | 'specific_date' | 'date_range'
    /** @enum {string} */
    'domain.EffectType': 'percent' | 'fixed'
    /** @enum {string} */
    'domain.PropertyOperator': 'eq' | 'not_eq'
    /** @enum {string} */
    'domain.RuleStatus': 'active' | 'disabled' | 'invalid'
    'guesthttp.FormRef': {
      /** @example a94f2c1e5b */
      hash: string
      /** @example guest */
      id: string
    }
    'guesthttp.FormResponse': {
      /** @description FormDSL definition tree */
      definition: {
        [key: string]: unknown
      }
      /**
       * @description always set: content hash of the definition
       * @example a94f2c1e5b
       */
      hash: string
    }
    'guesthttp.GuestBookingGuestInfo': {
      /** @example John */
      first_name?: string
      /**
       * Format: uuid
       * @example 550e8400-e29b-41d4-a716-446655440030
       */
      id?: string
      /** @example Doe */
      last_name?: string
    }
    'guesthttp.GuestBookingListItem': {
      guest?: components['schemas']['guesthttp.GuestBookingGuestInfo']
      /** @example 550e8400-e29b-41d4-a716-446655440050 */
      id: string
      /**
       * @example confirmed
       * @enum {string}
       */
      status: 'confirmed' | 'checked_in' | 'checked_out' | 'canceled'
      stay: components['schemas']['guesthttp.GuestBookingStayData']
    }
    'guesthttp.GuestBookingStayData': {
      /**
       * Format: date-time
       * @example 2026-03-15T14:00:00Z
       */
      check_in: string
      /**
       * Format: date-time
       * @example 2026-03-17T12:00:00Z
       */
      check_out: string
    }
    'guesthttp.GuestDataRequest': {
      /** @example john@example.com */
      email?: string | null
      /** @example John */
      first_name: string
      /** @example Doe */
      last_name: string
      /** @example +77001234567 */
      phone?: string | null
    }
    'guesthttp.GuestDetailWithFormMeta': {
      _form: components['schemas']['guesthttp.FormRef']
      /** @example false */
      blocked: boolean
      /** @example john@example.com */
      email?: string | null
      /** @example John */
      first_name: string
      /** @example Doe */
      last_name: string
      /** @example +77001234567 */
      phone?: string | null
    }
    'guesthttp.GuestListItem': {
      /** @example false */
      blocked: boolean
      /** @example john@example.com */
      email?: string
      /** @example John */
      first_name: string
      /** @example 550e8400-e29b-41d4-a716-446655440030 */
      id: string
      /** @example Doe */
      last_name: string
      /** @example +77001234567 */
      phone?: string
    }
    'guesthttp.UpdateFormRequest': {
      /** @description FormDSL definition tree */
      definition: {
        [key: string]: unknown
      }
    }
    'iamhttp.AccountBundleResponse': {
      account: components['schemas']['iamhttp.AccountInfoBody']
      permissions: components['schemas']['iamhttp.PermissionsResponse']
      profile: components['schemas']['iamhttp.AccountProfileBody']
      settings: components['schemas']['iamhttp.AccountSettingsBody']
    }
    'iamhttp.AccountInfoBody': {
      /** @example admin@qonaq.com */
      email: string
    }
    'iamhttp.AccountProfileBody': {
      /** @example Aida */
      first_name: string
      /** @example Nur */
      last_name: string
    }
    'iamhttp.AccountSettingsBody': {
      /**
       * @example en
       * @enum {string|null}
       */
      locale: 'en' | 'ru' | null
    }
    'iamhttp.AuthTokensResponse': {
      /** @example eyJhbGciOiJIUzI1NiIs... */
      access_token: string
      /** @example eyJhbGciOiJIUzI1NiIs... */
      refresh_token: string
    }
    'iamhttp.BillingPermissionsOverrideResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      collect_payment?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      modify?: 0 | 1 | 2 | 3
      /**
       * @example 0
       * @enum {integer}
       */
      refund?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.BillingPermissionsResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      collect_payment?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      modify?: 0 | 1 | 2 | 3
      /**
       * @example 0
       * @enum {integer}
       */
      refund?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.BookingsPermissionsOverrideResponse': {
      /**
       * @example 0
       * @enum {integer}
       */
      cancel?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      modify?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      operate?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.BookingsPermissionsResponse': {
      /**
       * @example 0
       * @enum {integer}
       */
      cancel?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      modify?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      operate?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.CompleteInviteRequest': {
      /** @example secureP@ss123 */
      password: string
    }
    'iamhttp.CreateEmployeeResponse': {
      employee: components['schemas']['iamhttp.EmployeeDetailResponse']
      /** @example aes-gcm-encrypted-token */
      invite_token?: string
    }
    'iamhttp.CreateOccupationRequest': {
      permissions?: components['schemas']['iamhttp.PermissionsRequest']
      /**
       * @example front_office
       * @enum {string}
       */
      role_key:
        | 'executive'
        | 'administration_back_office'
        | 'revenue_pricing'
        | 'front_office'
        | 'housekeeping_operations'
      /** @example Night Reception */
      title: string
    }
    'iamhttp.EmployeeDataRequest': {
      /** @example reception@qonaq.com */
      email: string
      /** @example Aida */
      first_name: string
      /** @example Nur */
      last_name: string
      /** @example +77001234567 */
      phone?: string | null
    }
    'iamhttp.EmployeeDetailResponse': {
      _form: components['schemas']['iamhttp.FormRef']
      effective_permissions: components['schemas']['iamhttp.PermissionsResponse']
      /** @example reception@qonaq.com */
      email: string
      /** @example Aida */
      first_name: string
      /** @example Nur */
      last_name: string
      /** @description null when the employee has no occupations */
      occupation_ids: string[] | null
      occupations: components['schemas']['iamhttp.OccupationSummaryResponse'][]
      permission_overrides: components['schemas']['iamhttp.PermissionOverridesResponse']
      /** @example +77001234567 */
      phone?: string | null
    }
    'iamhttp.EmployeeListItem': {
      /** @example reception@qonaq.com */
      email: string
      /** @example Aida */
      first_name: string
      /** @example 550e8400-e29b-41d4-a716-446655440020 */
      id: string
      /** @example Nur */
      last_name: string
    }
    'iamhttp.EmployeeOccupationsResponse': {
      /** @example 550e8400-e29b-41d4-a716-446655440020 */
      employee_id: string
      /** @description null when the employee has no occupations */
      occupation_ids: string[] | null
      occupations: components['schemas']['iamhttp.OccupationResponse'][]
    }
    'iamhttp.EmployeePermissionsResponse': {
      effective_permissions: components['schemas']['iamhttp.PermissionsResponse']
      /** @example 550e8400-e29b-41d4-a716-446655440020 */
      employee_id: string
      /** @description null when the employee has no occupations */
      occupation_ids: string[] | null
      occupation_templates: components['schemas']['iamhttp.OccupationResponse'][]
      permission_overrides: components['schemas']['iamhttp.PermissionOverridesResponse']
    }
    'iamhttp.EmployeesPermissionsOverrideResponse': {
      /**
       * @example 0
       * @enum {integer}
       */
      delete?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.EmployeesPermissionsResponse': {
      /**
       * @example 0
       * @enum {integer}
       */
      delete?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.FormRef': {
      /** @example a94f2c1e5b */
      hash: string
      /** @example employee */
      id: string
    }
    'iamhttp.FormResponse': {
      /** @description FormDSL definition tree */
      definition: {
        [key: string]: unknown
      }
      /**
       * @description always set: content hash of the definition
       * @example a94f2c1e5b
       */
      hash: string
    }
    'iamhttp.GuestsPermissionsOverrideResponse': {
      /**
       * @example 0
       * @enum {integer}
       */
      block?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      modify?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.GuestsPermissionsResponse': {
      /**
       * @example 0
       * @enum {integer}
       */
      block?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      modify?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.HotelPermissionsOverrideResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      manage?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage_occupations?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage_permissions?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.HotelPermissionsResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      manage?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage_occupations?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage_permissions?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.HousekeepingTasksPermissionsOverrideResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      assign?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      operate?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.HousekeepingTasksPermissionsResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      assign?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      operate?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.InviteInfoResponse': {
      /** @example admin@qonaq.com */
      email: string
      /** @example 550e8400-e29b-41d4-a716-446655440000 */
      organization_id: string
      /** @example Qonaq Hotel Group */
      organization_name: string
      /** @example 550e8400-e29b-41d4-a716-446655440002 */
      user_id: string
    }
    'iamhttp.LoginRequest': {
      /** @example admin@qonaq.com */
      email: string
      /** @example secureP@ss123 */
      password: string
    }
    'iamhttp.MaintenanceTasksPermissionsOverrideResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      assign?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      operate?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.MaintenanceTasksPermissionsResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      assign?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      operate?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.OccupationResponse': {
      /** @example 550e8400-e29b-41d4-a716-446655440030 */
      id: string
      permissions: components['schemas']['iamhttp.PermissionsResponse']
      /**
       * @example front_office
       * @enum {string}
       */
      role_key:
        | 'executive'
        | 'administration_back_office'
        | 'revenue_pricing'
        | 'front_office'
        | 'housekeeping_operations'
      /** @example iam.roles.front_office */
      role_title: string
      /** @example Front Office Supervisor */
      title: string
    }
    'iamhttp.OccupationRoleGroupResponse': {
      occupations: components['schemas']['iamhttp.OccupationResponse'][]
      /**
       * @example front_office
       * @enum {string}
       */
      role_key:
        | 'executive'
        | 'administration_back_office'
        | 'revenue_pricing'
        | 'front_office'
        | 'housekeeping_operations'
      /** @example iam.roles.front_office */
      role_title: string
    }
    'iamhttp.OccupationSummaryResponse': {
      /** @example 550e8400-e29b-41d4-a716-446655440030 */
      id: string
      /**
       * @example front_office
       * @enum {string}
       */
      role_key:
        | 'executive'
        | 'administration_back_office'
        | 'revenue_pricing'
        | 'front_office'
        | 'housekeeping_operations'
      /** @example iam.roles.front_office */
      role_title: string
      /** @example Front Office Supervisor */
      title: string
    }
    'iamhttp.PermissionOverridesResponse': {
      billing?: components['schemas']['iamhttp.BillingPermissionsOverrideResponse']
      bookings?: components['schemas']['iamhttp.BookingsPermissionsOverrideResponse']
      employees?: components['schemas']['iamhttp.EmployeesPermissionsOverrideResponse']
      guests?: components['schemas']['iamhttp.GuestsPermissionsOverrideResponse']
      hotel?: components['schemas']['iamhttp.HotelPermissionsOverrideResponse']
      housekeeping_tasks?: components['schemas']['iamhttp.HousekeepingTasksPermissionsOverrideResponse']
      maintenance_tasks?: components['schemas']['iamhttp.MaintenanceTasksPermissionsOverrideResponse']
      pricing?: components['schemas']['iamhttp.PricingPermissionsOverrideResponse']
      rooms?: components['schemas']['iamhttp.RoomsPermissionsOverrideResponse']
    }
    'iamhttp.PermissionsRequest': {
      billing?: components['schemas']['iamhttp.BillingPermissionsResponse']
      bookings?: components['schemas']['iamhttp.BookingsPermissionsResponse']
      employees?: components['schemas']['iamhttp.EmployeesPermissionsResponse']
      guests?: components['schemas']['iamhttp.GuestsPermissionsResponse']
      hotel?: components['schemas']['iamhttp.HotelPermissionsResponse']
      housekeeping_tasks?: components['schemas']['iamhttp.HousekeepingTasksPermissionsResponse']
      maintenance_tasks?: components['schemas']['iamhttp.MaintenanceTasksPermissionsResponse']
      pricing?: components['schemas']['iamhttp.PricingPermissionsResponse']
      rooms?: components['schemas']['iamhttp.RoomsPermissionsResponse']
    }
    'iamhttp.PermissionsResponse': {
      billing: components['schemas']['iamhttp.BillingPermissionsResponse']
      bookings: components['schemas']['iamhttp.BookingsPermissionsResponse']
      employees: components['schemas']['iamhttp.EmployeesPermissionsResponse']
      guests: components['schemas']['iamhttp.GuestsPermissionsResponse']
      hotel: components['schemas']['iamhttp.HotelPermissionsResponse']
      housekeeping_tasks: components['schemas']['iamhttp.HousekeepingTasksPermissionsResponse']
      maintenance_tasks: components['schemas']['iamhttp.MaintenanceTasksPermissionsResponse']
      pricing: components['schemas']['iamhttp.PricingPermissionsResponse']
      rooms: components['schemas']['iamhttp.RoomsPermissionsResponse']
    }
    'iamhttp.PricingPermissionsOverrideResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      adjust?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.PricingPermissionsResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      adjust?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.ProvisionRequest': {
      /** @example Grand Qonaq */
      hotel_name: string
      /** @example Qonaq Hotel Group */
      organization_name: string
      /** @example admin@qonaq.com */
      user_email: string
      /** @example Aigerim */
      user_first_name: string
      /** @example Serikova */
      user_last_name: string
    }
    'iamhttp.ProvisionResponse': {
      /** @example 550e8400-e29b-41d4-a716-446655440001 */
      hotel_id: string
      /** @example aes-gcm-encrypted-token */
      invite_token: string
      /** @example 550e8400-e29b-41d4-a716-446655440000 */
      organization_id: string
      /** @example 550e8400-e29b-41d4-a716-446655440002 */
      user_id: string
    }
    'iamhttp.RefreshRequest': {
      /** @example eyJhbGciOiJIUzI1NiIs... */
      refresh_token: string
    }
    'iamhttp.ReplaceEmployeeOccupationsRequest': {
      /** @description omitted, null or [] unlinks all occupations */
      occupation_ids?: string[] | null
    }
    'iamhttp.ReplaceEmployeePermissionsRequest': {
      /** @description omitted clears all overrides */
      overrides?: components['schemas']['iamhttp.PermissionOverridesResponse']
    }
    'iamhttp.RoomsPermissionsOverrideResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.RoomsPermissionsResponse': {
      /**
       * @example 1
       * @enum {integer}
       */
      create?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      manage?: 0 | 1 | 2 | 3
      /**
       * @example 1
       * @enum {integer}
       */
      view?: 0 | 1 | 2 | 3
    }
    'iamhttp.UpdateAccountAccountPart': {
      /** @description Required with NewPassword when changing password */
      currentPassword?: string | null
      /** @example admin@qonaq.com */
      email?: string | null
      newPassword?: string | null
    }
    'iamhttp.UpdateAccountRequest': {
      /** @description Email/password changes */
      account?: components['schemas']['iamhttp.UpdateAccountAccountPart'] | null
      /** @description Settings merged when present; per-key JSON null clears that key. Unknown keys → iam.unknown_setting_key. */
      settings?: components['schemas']['iamhttp.UpdateAccountSettingsPart'] | null
    }
    'iamhttp.UpdateAccountSettingsPart': {
      /**
       * @description null or "" clears the setting
       * @example en
       * @enum {string|null}
       */
      locale?: 'en' | 'ru' | '' | null
    }
    'iamhttp.UpdateFormRequest': {
      /** @description FormDSL definition tree */
      definition: {
        [key: string]: unknown
      }
    }
    'iamhttp.UpdateOccupationRequest': {
      permissions?: components['schemas']['iamhttp.PermissionsRequest']
      /**
       * @example front_office
       * @enum {string}
       */
      role_key:
        | 'executive'
        | 'administration_back_office'
        | 'revenue_pricing'
        | 'front_office'
        | 'housekeeping_operations'
      /** @example Night Reception */
      title: string
    }
    'pricinghttp.BaseRateItemDTO': {
      /** @example 1000000 */
      base_rate_minor: number
      /** @example 550e8400-e29b-41d4-a716-446655440010 */
      room_type_id: string
    }
    'pricinghttp.BaseRatesResponse': {
      rates: components['schemas']['pricinghttp.BaseRateItemDTO'][]
    }
    'pricinghttp.BookingQuoteNightDTO': {
      /** @description omitted when empty */
      adjustments?: components['schemas']['pricinghttp.QuoteAdjustmentDTO'][]
      /** @example 1000000 */
      base_rate: number
      /**
       * Format: date
       * @example 2026-03-27
       */
      date: string
      /** @example 550e8400-e29b-41d4-a716-446655440010 */
      room_type_id: string
      /** @example 1200000 */
      subtotal: number
    }
    'pricinghttp.BookingQuoteResponse': {
      /** @example 2026-03-26T12:00:00Z */
      calculated_at: string
      /** @example 2280000 */
      grand_total: number
      /** @description ManualAdjustments echoes the `adjustments` of the last booking write, as sent; use it for round-tripping on updates. */
      manual_adjustments?: components['schemas']['pricinghttp.QuoteManualAdjustmentDTO'][] | null
      nights: components['schemas']['pricinghttp.BookingQuoteNightDTO'][]
      /** @example 2400000 */
      nights_subtotal: number
      /** @description omitted when empty */
      total_adjustments?: components['schemas']['pricinghttp.QuoteAdjustmentDTO'][]
      /** @example 1 */
      version: number
    }
    'pricinghttp.CalculateQuoteRequest': {
      /** @description booking form data for property conditions; free-form */
      booking_data?: {
        [key: string]: unknown
      } | null
      /**
       * @description not used by the calculation
       * @example 550e8400-e29b-41d4-a716-446655440050
       */
      booking_id?: string | null
      /**
       * Format: date-time
       * @example 2026-03-27T14:00:00Z
       */
      check_in: string
      /**
       * Format: date-time
       * @example 2026-03-29T12:00:00Z
       */
      check_out: string
      /** @example 550e8400-e29b-41d4-a716-446655440030 */
      guest_id?: string | null
      manual_adjustments?: components['schemas']['pricinghttp.QuoteManualAdjustmentDTO'][] | null
      rooms: components['schemas']['pricinghttp.QuoteRoomDTO'][]
    }
    'pricinghttp.ConditionsResponse': {
      /** @description Conditions are condition candidates copied from booking form nodes ({field_id, type, label, bind, options}); free-form. */
      conditions: {
        [key: string]: unknown
      }[]
      /** @example a1b2c3d4e5 */
      hash: string
    }
    'pricinghttp.CreatePricingRuleRequest': {
      conditions?: components['schemas']['pricinghttp.RuleConditionDTO'][] | null
      effect: components['schemas']['pricinghttp.RuleEffectDTO']
      /** @example OTA New Year surcharge */
      name: string
      /** @example 10 */
      priority: number
      /**
       * @description omitted or null → active
       * @example active
       * @enum {string|null}
       */
      status?: 'active' | 'disabled' | null
    }
    'pricinghttp.InvalidReasonDTO': {
      /**
       * @example select_option_removed
       * @enum {string}
       */
      code: 'field_deleted' | 'select_option_removed'
      /** @example 0 */
      condition_index?: number
      /** @description free-form, depends on code */
      details?: {
        [key: string]: unknown
      }
      /** @example booking_source */
      field_id?: string
      /** @example rule references a removed select value */
      message: string
    }
    'pricinghttp.PricingRuleResponse': {
      conditions: components['schemas']['pricinghttp.RuleConditionDTO'][]
      /** @example 2026-03-26T12:00:00Z */
      created_at: string
      effect: components['schemas']['pricinghttp.RuleEffectDTO']
      /** @example 550e8400-e29b-41d4-a716-446655440300 */
      id: string
      /** @description set when status is invalid */
      invalid_reason: components['schemas']['pricinghttp.InvalidReasonDTO'] | null
      /** @example OTA New Year surcharge */
      name: string
      /** @example 10 */
      priority: number
      /** @example active */
      status: components['schemas']['domain.RuleStatus']
      /** @example 2026-03-26T12:00:00Z */
      updated_at: string
    }
    'pricinghttp.QuoteAdjustmentDTO': {
      /** @example 2000 */
      amount: number
      /** @example per_night */
      apply_to: components['schemas']['domain.ApplyTo']
      /** @example Weekend surcharge */
      name: string
      /** @example rule */
      source: components['schemas']['domain.AdjustmentSource']
      /** @example 550e8400-e29b-41d4-a716-446655440300 */
      source_id?: string
      /** @example percent */
      type: components['schemas']['domain.EffectType']
      /** @example 2000 */
      value: number
    }
    'pricinghttp.QuoteManualAdjustmentDTO': {
      effect?: components['schemas']['pricinghttp.RuleEffectDTO']
      /** @example VIP Campaign */
      name?: string
    }
    'pricinghttp.QuoteNightDTO': {
      adjustments: components['schemas']['pricinghttp.QuoteAdjustmentDTO'][]
      /** @example 1000000 */
      base_rate: number
      /**
       * Format: date
       * @example 2026-03-27
       */
      date: string
      /** @example 550e8400-e29b-41d4-a716-446655440010 */
      room_type_id: string
      /** @example 1200000 */
      subtotal: number
    }
    'pricinghttp.QuoteRoomDTO': {
      /** @example 550e8400-e29b-41d4-a716-446655440010 */
      room_type_id: string
    }
    'pricinghttp.RuleConditionDTO': {
      /**
       * Format: date
       * @example 2026-12-31
       */
      date?: string
      /** @example booking_source */
      field_id?: string
      /**
       * Format: date
       * @example 2026-12-25
       */
      from?: string
      /** @example eq */
      operator?: components['schemas']['domain.PropertyOperator']
      /**
       * Format: date
       * @example 2026-12-31
       */
      to?: string
      /** @example property */
      type: components['schemas']['domain.ConditionType']
      /** @example ota */
      value?: string
    }
    'pricinghttp.RuleEffectDTO': {
      /** @example per_night */
      apply_to: components['schemas']['domain.ApplyTo']
      /** @example percent */
      type: components['schemas']['domain.EffectType']
      /** @example 1500 */
      value: number
    }
    'pricinghttp.StayQuoteResponse': {
      /** @example 2280000 */
      grand_total: number
      nights: components['schemas']['pricinghttp.QuoteNightDTO'][]
      /** @example 2400000 */
      nights_subtotal: number
      total_adjustments: components['schemas']['pricinghttp.QuoteAdjustmentDTO'][]
    }
    'pricinghttp.UpdateBaseRatesRequest': {
      rates?: components['schemas']['pricinghttp.BaseRateItemDTO'][] | null
    }
    'pricinghttp.UpdatePricingRuleRequest': {
      conditions?: components['schemas']['pricinghttp.RuleConditionDTO'][] | null
      effect: components['schemas']['pricinghttp.RuleEffectDTO']
      /** @example OTA New Year surcharge */
      name: string
      /** @example 10 */
      priority: number
      /**
       * @description omitted or null → active
       * @example active
       * @enum {string|null}
       */
      status?: 'active' | 'disabled' | null
    }
    'propertyhttp.AvailableRoomResponse': {
      /** @example 550e8400-e29b-41d4-a716-446655440020 */
      id: string
      /** @example 101 */
      number: string
      /** @example 550e8400-e29b-41d4-a716-446655440010 */
      room_type_id: string
      /** @example Standard Double */
      room_type_name: string
      /**
       * @example selectable_with_warning
       * @enum {string}
       */
      state:
        | 'selectable'
        | 'selectable_with_warning'
        | 'blocked_by_inventory'
        | 'blocked_by_maintenance'
        | 'blocked_by_occupancy'
      /**
       * @description omitted when empty
       * @example [
       *       "housekeeping.dirty"
       *     ]
       */
      warnings?: (
        | 'availability.ooo'
        | 'availability.occupied'
        | 'maintenance.under_maintenance'
        | 'maintenance.required'
        | 'housekeeping.dirty'
        | 'housekeeping.cleaning'
        | 'housekeeping.inspection'
      )[]
    }
    'propertyhttp.ChangeRoomAvailabilityRequest': {
      /**
       * @example ooo
       * @enum {string}
       */
      status: 'available' | 'ooo'
    }
    'propertyhttp.ChangeRoomHousekeepingRequest': {
      /**
       * Format: uuid
       * @description uuid or explicit null to clear.
       */
      assignee_employee_id?: string | null
      /** @description Task description (optional). */
      description?: string
      /**
       * @example dirty
       * @enum {string}
       */
      status: 'dirty' | 'cleaning' | 'inspection' | 'clean'
    }
    'propertyhttp.ChangeRoomMaintenanceRequest': {
      /** Format: uuid */
      assignee_employee_id?: string | null
      /** @example HVAC coil replacement */
      description?: string
      /**
       * @description required for required/under_maintenance when a task is created or started
       * @example 2026-04-20T12:00:00Z
       */
      planned_end?: string | null
      /**
       * @example under_maintenance
       * @enum {string}
       */
      status: 'none' | 'required' | 'under_maintenance'
    }
    'propertyhttp.CreateRoomRequest': {
      /**
       * @description Non-empty
       * @example 101
       */
      number: string
      /**
       * @description Must exist in this hotel
       * @example 550e8400-e29b-41d4-a716-446655440010
       */
      room_type_id: string
    }
    'propertyhttp.CreateRoomTypeRequest': {
      /** @example A cozy room with a double bed */
      description?: string | null
      /** @example Standard Double */
      name: string
    }
    'propertyhttp.HotelResponse': {
      /** @example 14:00 */
      check_in_hour: string
      /** @example 12:00 */
      check_out_hour: string
      /** @example KZT */
      currency: string
      /** @example 550e8400-e29b-41d4-a716-446655440000 */
      id: string
      /** @example Grand Plaza */
      name: string
    }
    'propertyhttp.RoomActivityEntryResponse': {
      event_id: string
      /**
       * @example RoomHousekeepingChanged
       * @enum {string}
       */
      event_type:
        | 'RoomAvailabilityChanged'
        | 'RoomHousekeepingChanged'
        | 'RoomMaintenanceChanged'
        | 'RoomMaintenancePlannedEndChanged'
      /** @description actor attribution */
      metadata?: {
        [key: string]: unknown
      }
      /** @example 2026-04-18T10:32:00Z */
      occurred_at: string
      /** @description event payload, depends on event_type */
      payload: {
        [key: string]: unknown
      }
      /** @example 4 */
      version: number
    }
    'propertyhttp.RoomResponse': {
      /**
       * @example available
       * @enum {string}
       */
      availability_status: 'available' | 'ooo'
      /**
       * @example clean
       * @enum {string}
       */
      housekeeping_status: 'dirty' | 'cleaning' | 'inspection' | 'clean'
      /** @example 550e8400-e29b-41d4-a716-446655440020 */
      id: string
      /**
       * @description Free-form description of the maintenance work.
       * @example HVAC coil replacement
       */
      maintenance_description?: string
      /**
       * @description RFC3339; set when maintenance has a planned completion.
       * @example 2026-04-20T12:00:00Z
       */
      maintenance_planned_end?: string
      /**
       * @example none
       * @enum {string}
       */
      maintenance_status: 'none' | 'required' | 'under_maintenance'
      /** @example 101 */
      number: string
      /** @example 550e8400-e29b-41d4-a716-446655440010 */
      room_type_id: string
      /**
       * @description Event-sourced version for optimistic concurrency.
       * @example 3
       */
      version: number
    }
    'propertyhttp.RoomTypeResponse': {
      /** @example A cozy room with a double bed */
      description?: string
      /** @example 550e8400-e29b-41d4-a716-446655440010 */
      id: string
      /** @example Standard Double */
      name: string
    }
    'propertyhttp.UpdateHotelRequest': {
      /**
       * @description HH:MM; empty or omitted → 14:00
       * @example 14:00
       */
      check_in_hour?: string
      /**
       * @description HH:MM; empty or omitted → 12:00
       * @example 12:00
       */
      check_out_hour?: string
      /**
       * @description ISO 4217 alpha-3
       * @example KZT
       */
      currency: string
      /**
       * @description Non-empty after trim
       * @example Grand Plaza
       */
      name: string
    }
    'propertyhttp.UpdateRoomRequest': {
      /**
       * @description Non-empty after trim
       * @example 101
       */
      number: string
      /** @example 550e8400-e29b-41d4-a716-446655440010 */
      room_type_id: string
    }
    'propertyhttp.UpdateRoomTypeRequest': {
      /** @example A cozy room with a double bed */
      description?: string | null
      /** @example Standard Double */
      name: string
    }
    'sharedhttp.APIError': {
      /**
       * @description Code stable machine-readable id: common.*, iam.*, guest.*, booking.*, property.*
       * @example common.unauthorized
       */
      code: string
      /** @description Fields optional JSON property paths for form-related errors (label lookup / focus). */
      fields?: string[]
      /** @description Issues optional list when multiple problems are returned in one response. */
      issues?: components['schemas']['sharedhttp.APIErrorIssue'][]
      /**
       * @description Message English fallback for logs and non-localized UIs; do not rely on it for user-facing copy.
       * @example unauthorized
       */
      message: string
    }
    'sharedhttp.APIErrorIssue': {
      /** @example guest.first_name_required */
      code: string
      fields?: string[]
      /** @example first name is required */
      message: string
    }
    'sharedhttp.ErrorResponse': {
      error: components['schemas']['sharedhttp.APIError']
    }
    'taskshttp.ChangeHousekeepingTaskStatusRequest': {
      /**
       * @example in_progress
       * @enum {string}
       */
      status: 'in_progress' | 'inspection' | 'done' | 'canceled'
    }
    'taskshttp.ChangeMaintenanceTaskStatusRequest': {
      /**
       * @example in_progress
       * @enum {string}
       */
      status: 'in_progress' | 'done' | 'canceled'
    }
    'taskshttp.CreateHousekeepingTaskRequest': {
      assignee_employee_id?: string | null
      description?: string
      room_id: string
    }
    'taskshttp.CreateMaintenanceTaskRequest': {
      assignee_employee_id?: string | null
      description?: string
      /** @example 2026-05-01T12:00:00Z */
      planned_end: string
      room_id: string
    }
    'taskshttp.HousekeepingTaskResponse': {
      assignee_employee_id?: string
      /** @description set when source=auto_checkout */
      booking_id?: string
      canceled_at?: string
      completed_at?: string
      created_at: string
      created_by_employee_id: string
      /** @description omitted when empty */
      description?: string
      id: string
      room_id: string
      /**
       * @example manual
       * @enum {string}
       */
      source: 'manual' | 'auto_checkout'
      /**
       * @example open
       * @enum {string}
       */
      status: 'open' | 'in_progress' | 'inspection' | 'done' | 'canceled'
      updated_at: string
      updated_by_employee_id: string
    }
    'taskshttp.MaintenanceTaskResponse': {
      assignee_employee_id?: string
      canceled_at?: string
      completed_at?: string
      created_at: string
      created_by_employee_id: string
      /** @description omitted when empty */
      description?: string
      id: string
      /** @example 2026-05-01T12:00:00Z */
      planned_end?: string
      room_id: string
      /**
       * @example manual
       * @enum {string}
       */
      source: 'manual'
      /**
       * @example open
       * @enum {string}
       */
      status: 'open' | 'in_progress' | 'done' | 'canceled'
      updated_at: string
      updated_by_employee_id: string
    }
    'taskshttp.UpdateHousekeepingTaskRequest': {
      /**
       * Format: uuid
       * @description null clears the assignee
       */
      assignee_employee_id?: string | null
      description?: string
    }
    'taskshttp.UpdateMaintenanceTaskRequest': {
      /**
       * Format: uuid
       * @description null clears the assignee
       */
      assignee_employee_id?: string | null
      description?: string
      /**
       * Format: date-time
       * @description null clears the date
       */
      planned_end?: string | null
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
  getAccount: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.AccountBundleResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateAccount: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Partial account and settings */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.UpdateAccountRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.AccountBundleResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getInvite: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Invite token */
        token: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.InviteInfoResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  completeInvite: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Invite token */
        token: string
      }
      cookie?: never
    }
    /** @description Password payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.CompleteInviteRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.AuthTokensResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  loginUser: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Login credentials */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.LoginRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.AuthTokensResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  refreshSession: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description JSON body must include refresh_token (JWT with token_use=refresh) */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.RefreshRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.AuthTokensResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  addManualAdjustment: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        bookingId: string
      }
      cookie?: never
    }
    /** @description Adjustment payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['billinghttp.AdjustmentRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.AdjustmentResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unprocessable Entity */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getBookingBalance: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        bookingId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.BookingBalanceResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getBill: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        bookingId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.BillResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  closeBill: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        bookingId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.CloseBillResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unprocessable Entity */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  recordPayment: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        bookingId: string
      }
      cookie?: never
    }
    /** @description Payment payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['billinghttp.PaymentRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.PaymentResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unprocessable Entity */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  recordRefund: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        bookingId: string
      }
      cookie?: never
    }
    /** @description Refund payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['billinghttp.RefundRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.RefundResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unprocessable Entity */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listLedgerEntries: {
    parameters: {
      query: {
        /** @description Start date (inclusive, RFC 3339 or YYYY-MM-DD) */
        from: string
        /** @description End date (exclusive, RFC 3339 or YYYY-MM-DD) */
        to: string
        /** @description Filter by entry type(s), comma-separated */
        entry_type?: string
        /** @description Page size (default 50, max 200) */
        limit?: number
        /** @description Offset for pagination */
        offset?: number
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.LedgerListResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getDailyBreakdown: {
    parameters: {
      query: {
        /** @description Start date (inclusive, RFC 3339 or YYYY-MM-DD) */
        from: string
        /** @description End date (exclusive, RFC 3339 or YYYY-MM-DD) */
        to: string
        /** @description Filter by entry type(s), comma-separated */
        entry_type?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.DailyBreakdownResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getMonthlyBreakdown: {
    parameters: {
      query: {
        /** @description Start date (inclusive, RFC 3339 or YYYY-MM-DD) */
        from: string
        /** @description End date (exclusive, RFC 3339 or YYYY-MM-DD) */
        to: string
        /** @description Filter by entry type(s), comma-separated */
        entry_type?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.MonthlyBreakdownResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getOutstandingBalances: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.OutstandingBalancesResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getFinancialOverview: {
    parameters: {
      query: {
        /** @description Start date (inclusive, RFC 3339 or YYYY-MM-DD) */
        from: string
        /** @description End date (exclusive, RFC 3339 or YYYY-MM-DD) */
        to: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['billinghttp.OverviewResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listBookings: {
    parameters: {
      query?: {
        /** @description Search by guest first/last name (substring) */
        q?: string
        /** @description With `to`: filter check_out >= this date (YYYY-MM-DD) */
        from?: string
        /** @description With `from`: filter check_in <= this date (YYYY-MM-DD) */
        to?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.BookingItem'][]
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createBooking: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Flat guest + stay (+ optional adjustments) */
    requestBody: {
      content: {
        'application/json': components['schemas']['bookinghttp.CreateBookingRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.BookingItem']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Form rules validation failed */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getBooking: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.BookingItem']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateBooking: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        id: string
      }
      cookie?: never
    }
    /** @description Flat stay (+ optional guest, adjustments) */
    requestBody: {
      content: {
        'application/json': components['schemas']['bookinghttp.UpdateBookingRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.BookingItem']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Form rules validation or unprocessable entity */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  cancelBooking: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.BookingItem']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unprocessable Entity */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  checkInBooking: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.BookingItem']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unprocessable Entity */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  checkOutBooking: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        id: string
      }
      cookie?: never
    }
    /** @description Optional force-unpaid flag */
    requestBody?: {
      content: {
        'application/json': components['schemas']['bookinghttp.CheckOutRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.BookingItem']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Outstanding Balance */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.OutstandingBalanceErrorResponse']
        }
      }
      /** @description Unprocessable Entity */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getBookingForm: {
    parameters: {
      query?: {
        /** @description edit | view */
        target?: 'edit' | 'view'
      }
      header?: {
        /** @description Optional. Send the ETag response header value from a prior GET (hash wrapped in ASCII double quotes); matches the JSON hash field. */
        'If-None-Match'?: string
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.FormResponse']
        }
      }
      /** @description Not Modified — client sent matching If-None-Match */
      304: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getBookingFormDefinition: {
    parameters: {
      query?: never
      header?: {
        /** @description Optional. Send the ETag response header value from a prior GET (hash wrapped in ASCII double quotes). */
        'If-None-Match'?: string
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.FormResponse']
        }
      }
      /** @description Not Modified — client sent matching If-None-Match */
      304: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateBookingFormDefinition: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description FormDSL definition */
    requestBody: {
      content: {
        'application/json': components['schemas']['bookinghttp.UpdateFormRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.FormResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getReservationGrid: {
    parameters: {
      query: {
        /** @description Range start date YYYY-MM-DD */
        from: string
        /** @description Range end date YYYY-MM-DD */
        to: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['bookinghttp.BookingItem'][]
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listEmployees: {
    parameters: {
      query?: {
        /** @description Search by first name, last name, or email */
        search?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.EmployeeListItem'][]
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createEmployee: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Employee form data */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.EmployeeDataRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.CreateEmployeeResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Form rules validation failed */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getEmployee: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Employee ID */
        employee_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.EmployeeDetailResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateEmployee: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Employee ID */
        employee_id: string
      }
      cookie?: never
    }
    /** @description Employee form data */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.EmployeeDataRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.EmployeeDetailResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Form rules validation failed */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  replaceEmployeeOccupations: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Employee ID */
        employee_id: string
      }
      cookie?: never
    }
    /** @description Occupation ids */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.ReplaceEmployeeOccupationsRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.EmployeeOccupationsResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  replaceEmployeePermissions: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Employee ID */
        employee_id: string
      }
      cookie?: never
    }
    /** @description Permission overrides */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.ReplaceEmployeePermissionsRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.EmployeePermissionsResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getEmployeeForm: {
    parameters: {
      query?: {
        /** @description edit | view */
        target?: 'edit' | 'view'
      }
      header?: {
        /** @description Optional. Send the ETag response header value from a prior GET (hash wrapped in ASCII double quotes); matches the JSON hash field. */
        'If-None-Match'?: string
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.FormResponse']
        }
      }
      /** @description Not Modified — client sent matching If-None-Match */
      304: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getEmployeeFormDefinition: {
    parameters: {
      query?: never
      header?: {
        /** @description Optional. Send the ETag response header value from a prior GET (hash wrapped in ASCII double quotes). */
        'If-None-Match'?: string
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.FormResponse']
        }
      }
      /** @description Not Modified — client sent matching If-None-Match */
      304: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateEmployeeFormDefinition: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description FormDSL definition */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.UpdateFormRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.FormResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listGuests: {
    parameters: {
      query?: {
        /** @description Search by guest name, email, or phone (case-insensitive substring) */
        q?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['guesthttp.GuestListItem'][]
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createGuest: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Guest form data (flat object matching org guest schema) */
    requestBody: {
      content: {
        'application/json': components['schemas']['guesthttp.GuestDataRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['guesthttp.GuestDetailWithFormMeta']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Form rules validation failed */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getGuest: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Guest UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['guesthttp.GuestDetailWithFormMeta']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateGuest: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Guest UUID */
        id: string
      }
      cookie?: never
    }
    /** @description Guest form data */
    requestBody: {
      content: {
        'application/json': components['schemas']['guesthttp.GuestDataRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['guesthttp.GuestDetailWithFormMeta']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Form rules validation failed */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  blockGuest: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Guest UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listGuestBookings: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Guest UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['guesthttp.GuestBookingListItem'][]
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getGuestForm: {
    parameters: {
      query?: {
        /** @description edit | view */
        target?: 'edit' | 'view'
      }
      header?: {
        /** @description Optional. Send the ETag response header value from a prior GET (hash wrapped in ASCII double quotes); matches the JSON hash field. */
        'If-None-Match'?: string
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['guesthttp.FormResponse']
        }
      }
      /** @description Not Modified — client sent matching If-None-Match */
      304: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getGuestFormDefinition: {
    parameters: {
      query?: never
      header?: {
        /** @description Optional. Send the ETag response header value from a prior GET (hash wrapped in ASCII double quotes). */
        'If-None-Match'?: string
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['guesthttp.FormResponse']
        }
      }
      /** @description Not Modified — client sent matching If-None-Match */
      304: {
        headers: {
          /** @description no-store */
          'Cache-Control'?: string
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateGuestFormDefinition: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description FormDSL definition */
    requestBody: {
      content: {
        'application/json': components['schemas']['guesthttp.UpdateFormRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['guesthttp.FormResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  provisionOrganization: {
    parameters: {
      query?: never
      header: {
        /** @description Internal secret key */
        'Secret-Key': string
      }
      path?: never
      cookie?: never
    }
    /** @description Provision payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.ProvisionRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.ProvisionResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listOccupations: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.OccupationRoleGroupResponse'][]
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createOccupation: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Occupation payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.CreateOccupationRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.OccupationResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getOccupation: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Occupation ID */
        occupation_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.OccupationResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateOccupation: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Occupation ID */
        occupation_id: string
      }
      cookie?: never
    }
    /** @description Occupation payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['iamhttp.UpdateOccupationRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['iamhttp.OccupationResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  deleteOccupation: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Occupation ID */
        occupation_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getBaseRates: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.BaseRatesResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateBaseRates: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Array of room type rates */
    requestBody: {
      content: {
        'application/json': components['schemas']['pricinghttp.UpdateBaseRatesRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.BaseRatesResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getBookingQuote: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Booking UUID */
        bookingId: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Accommodation snapshot */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.BookingQuoteResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getPricingConditions: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.ConditionsResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  calculateQuote: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Stay parameters */
    requestBody: {
      content: {
        'application/json': components['schemas']['pricinghttp.CalculateQuoteRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.StayQuoteResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listPricingRules: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.PricingRuleResponse'][]
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createPricingRule: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Rule payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['pricinghttp.CreatePricingRuleRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.PricingRuleResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getPricingRule: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Pricing rule UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.PricingRuleResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updatePricingRule: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Pricing rule UUID */
        id: string
      }
      cookie?: never
    }
    /** @description Rule payload */
    requestBody: {
      content: {
        'application/json': components['schemas']['pricinghttp.UpdatePricingRuleRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['pricinghttp.PricingRuleResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  deletePricingRule: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Pricing rule UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getHotel: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.HotelResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateHotel: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description JSON with name and currency */
    requestBody: {
      content: {
        'application/json': components['schemas']['propertyhttp.UpdateHotelRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.HotelResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listRoomTypes: {
    parameters: {
      query?: {
        /** @description Search by room type name, description, or room number */
        q?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomTypeResponse'][]
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createRoomType: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description name required; description optional */
    requestBody: {
      content: {
        'application/json': components['schemas']['propertyhttp.CreateRoomTypeRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomTypeResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateRoomType: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room type UUID */
        id: string
      }
      cookie?: never
    }
    /** @description name required when updating */
    requestBody: {
      content: {
        'application/json': components['schemas']['propertyhttp.UpdateRoomTypeRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomTypeResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  deleteRoomType: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room type UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listRooms: {
    parameters: {
      query?: {
        /** @description Search by room number (case-insensitive substring) */
        q?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomResponse'][]
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createRoom: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description room_type_id and number required */
    requestBody: {
      content: {
        'application/json': components['schemas']['propertyhttp.CreateRoomRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getRoom: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateRoom: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room UUID */
        id: string
      }
      cookie?: never
    }
    /** @description room_type_id, number required */
    requestBody: {
      content: {
        'application/json': components['schemas']['propertyhttp.UpdateRoomRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  deleteRoom: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listRoomActivity: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomActivityEntryResponse'][]
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  changeRoomAvailability: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room UUID */
        id: string
      }
      cookie?: never
    }
    /** @description status = available | ooo */
    requestBody: {
      content: {
        'application/json': components['schemas']['propertyhttp.ChangeRoomAvailabilityRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.RoomResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  changeRoomHousekeeping: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room UUID */
        id: string
      }
      cookie?: never
    }
    /** @description status + optional description/assignee */
    requestBody: {
      content: {
        'application/json': components['schemas']['propertyhttp.ChangeRoomHousekeepingRequest']
      }
    }
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  changeRoomMaintenance: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Room UUID */
        id: string
      }
      cookie?: never
    }
    /** @description status + planned_end + optional description/assignee */
    requestBody: {
      content: {
        'application/json': components['schemas']['propertyhttp.ChangeRoomMaintenanceRequest']
      }
    }
    responses: {
      /** @description No Content */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listAvailableRooms: {
    parameters: {
      query?: {
        /** @description Start date (dd.MM.yyyy); required together with to */
        from?: string
        /** @description End date (dd.MM.yyyy); required together with from */
        to?: string
        /** @description Booking UUID; only with from+to — rooms occupied solely by this booking in the range count as available */
        exclude?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['propertyhttp.AvailableRoomResponse'][]
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listHousekeepingTasks: {
    parameters: {
      query?: {
        /** @description Filter by status */
        status?: 'open' | 'in_progress' | 'inspection' | 'done' | 'canceled'
        /** @description Filter by room UUID */
        room_id?: string
        /** @description Filter by assignee employee UUID */
        assignee?: string
        /** @description Only unassigned tasks */
        unassigned?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.HousekeepingTaskResponse'][]
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createHousekeepingTask: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description task body */
    requestBody: {
      content: {
        'application/json': components['schemas']['taskshttp.CreateHousekeepingTaskRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.HousekeepingTaskResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getHousekeepingTask: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Task UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.HousekeepingTaskResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateHousekeepingTask: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Task UUID */
        id: string
      }
      cookie?: never
    }
    /** @description fields to update */
    requestBody: {
      content: {
        'application/json': components['schemas']['taskshttp.UpdateHousekeepingTaskRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.HousekeepingTaskResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  changeHousekeepingTaskStatus: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Task UUID */
        id: string
      }
      cookie?: never
    }
    /** @description status */
    requestBody: {
      content: {
        'application/json': components['schemas']['taskshttp.ChangeHousekeepingTaskStatusRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.HousekeepingTaskResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  listMaintenanceTasks: {
    parameters: {
      query?: {
        /** @description Filter by status */
        status?: 'open' | 'in_progress' | 'done' | 'canceled'
        /** @description Filter by room UUID */
        room_id?: string
        /** @description Filter by assignee employee UUID */
        assignee?: string
        /** @description Only unassigned tasks */
        unassigned?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.MaintenanceTaskResponse'][]
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  createMaintenanceTask: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description task body */
    requestBody: {
      content: {
        'application/json': components['schemas']['taskshttp.CreateMaintenanceTaskRequest']
      }
    }
    responses: {
      /** @description Created */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.MaintenanceTaskResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Conflict */
      409: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  getMaintenanceTask: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Task UUID */
        id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.MaintenanceTaskResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  updateMaintenanceTask: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Task UUID */
        id: string
      }
      cookie?: never
    }
    /** @description fields to update */
    requestBody: {
      content: {
        'application/json': components['schemas']['taskshttp.UpdateMaintenanceTaskRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.MaintenanceTaskResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
  changeMaintenanceTaskStatus: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description Task UUID */
        id: string
      }
      cookie?: never
    }
    /** @description status */
    requestBody: {
      content: {
        'application/json': components['schemas']['taskshttp.ChangeMaintenanceTaskStatusRequest']
      }
    }
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['taskshttp.MaintenanceTaskResponse']
        }
      }
      /** @description Bad Request */
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Unauthorized */
      401: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Forbidden */
      403: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Not Found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
      /** @description Internal Server Error */
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['sharedhttp.ErrorResponse']
        }
      }
    }
  }
}
