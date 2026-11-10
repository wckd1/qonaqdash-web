# QonaqDash — Backend integration guide

This document is the **narrative** companion to the machine-readable API contract. Use it for architecture, auth flows, FormDSL behaviour, reservation-grid UX, and cross-cutting rules.

| Artifact | Role |
|----------|------|
| **`docs/swagger.yaml`** (and generated `docs/swagger.json`, UI at `/swagger/*` in development) | **Canonical** reference for every route, request/response shape, field descriptions, examples, and **per-endpoint error codes** (`error.code` for localization). |
| **This file** | Concepts that are awkward to express only in OpenAPI: multi-step auth, form/runtime split, booking lifecycle, grid behaviour, tenancy rules. |

---

## 1. Architecture overview

**Backend:** Go modular monolith — bounded contexts: **IAM**, **Property**, **Guest**, **Booking** (event-sourced, pure lifecycle), **Pricing** (quote calculation, rules, billing orchestration), **Billing** (guest bills + append-only ledger).  
**API:** REST, JSON bodies. **Auth:** JWT (HS256) Bearer.  
**Multi-tenancy:** Data is scoped by `organization_id` from the JWT; property and booking data also require `hotel_id` in the token for hotel-scoped routes (see Swagger “security” and each operation — org-only vs org+hotel is explicit per route).

**Base URL:** `http(s)://<host>:<port>/api`  
Interactive docs: `GET /swagger/index.html` (when the server runs in development mode).

### CORS (current defaults)

| Setting | Value |
|---------|-------|
| Allowed origins | `*` (tighten for production if cookies/credentials matter) |
| Methods | `GET, POST, PUT, DELETE, OPTIONS` |
| Headers | `Authorization, Content-Type, Secret-Key` |
| Credentials | `true` |

---

## 2. Authentication and authorization

### 2.1 JWT claims (access and refresh)

```typescript
interface JWTClaims {
  sub: string;        // user UUID
  org_id: string;     // organization UUID
  hotel_id?: string;  // hotel UUID — may be empty on org-only tokens
  token_use: "access" | "refresh";
  iat: number;
  exp: number;
}
```

Login and invite-complete return **access** + **refresh** pairs. Only tokens with `token_use=refresh` are accepted by `POST /api/auth/refresh`; only `token_use=access` tokens are accepted as Bearer credentials.

### 2.2 Protected requests

```
Authorization: Bearer <access_token>
```

In Swagger UI, each error status row is labeled with normal HTTP wording (e.g. **Unauthorized**, **Not Found**). The **`error.code`** values for that operation are listed in the operation **Description** under **Error codes** (shared JWT/parse codes are also summarized in the API-level description).

### 2.3 Flows (endpoint names only — payloads and errors in Swagger)

| Flow | Steps |
|------|--------|
| **A — Internal provision** | `POST /api/internal/provision` (header `Secret-Key`) → invite → `GET` / `POST /api/auth/invite/{token}` |
| **B — Invite registration** | `GET` then `POST /api/auth/invite/{token}` |
| **C — Login** | `POST /api/auth/login` |
| **C2 — Refresh** | `POST /api/auth/refresh` with refresh JWT |
| **D — Account** | `GET` / `PUT /api/account` |

### 2.4 Client hints

- Keep **access** short-lived (memory); **refresh** in `httpOnly` cookie or secure storage.
- On **401** with `common.jwt_expired`, call refresh then retry.
- Decode JWT for `org_id`, `hotel_id`, `sub`, `token_use` for UI routing.

### 2.5 Frontend permission integration

The frontend should treat **permissions as a capability hint plus runtime guard**, not as a hard-coded route matrix.

- The authenticated caller is represented server-side as a shared **actor**: user id, employee id, org id, optional hotel id, and **resolved effective permissions**.
- Non-IAM modules do **not** interpret raw permission trees directly. Each bounded context maps business operations to its own workflow-aware authorization rules.
- Because of that mapping, the frontend should use IAM permissions to drive navigation and affordances, but must still handle **`403 common.forbidden`** from the target endpoint as the final authority.

**Recommended frontend flow**

1. After login or refresh, fetch **`GET /api/account`**.
2. Read the employee/account context and the returned **`permissions`** bundle.
3. Use those permissions to decide which sections, actions, and settings screens to show.
4. Still handle endpoint-level **403** gracefully, because some permissions are intentionally broader or narrower than a naive `resource.action` check.

**Important:** hotel-scoped screens should only be enabled when the current auth context includes a **`hotel_id`**. Org-only JWT context is valid for IAM/account/editor flows, but not for hotel-scoped Property, Booking, Pricing, Billing, or most Guest runtime flows.

### 2.6 `403 common.forbidden`

All user-facing bounded contexts now use a consistent forbidden response:

```json
{
  "error": {
    "code": "common.forbidden",
    "message": "forbidden"
  }
}
```

Frontend guidance:

- Treat **403** as “authenticated, but this operation is not allowed for the current actor”.
- Prefer disabling clearly unavailable actions in advance when IAM permissions make that obvious.
- Do **not** assume hidden button == impossible flow. Some workflows intentionally allow access through adjacent business permissions.
- On **403**, keep the user in context, show a localized “no access” message, and refresh **`GET /api/account`** if the UI may be stale after a role change.

---

## 3. Error responses (shape only)

Failures return JSON:

```json
{
  "error": {
    "code": "guest.form_missing_core",
    "message": "form must contain required properties …",
    "fields": ["firstName", "lastName", "phone", "email", "main"]
  }
}
```

| Field | Meaning |
|-------|---------|
| `code` | Stable dotted id (`common.*`, `iam.*`, `guest.*`, `booking.*`, `property.*`, `pricing.*`, `billing.*`). **Use this as the localization key** (e.g. map to `errors.<code>` with dots as nesting in your i18n scheme). |
| `message` | English fallback for logs and non-localized clients. |
| `fields` | Optional JSON property names for form-related errors. |
| `issues` | Optional list of `{code,message,fields?}` — used for **422** **`common.validation_failed`** on guest/booking **POST/PUT** when the body breaks org form **`rules`** (and related checks); each row’s `code` is typically `validation.<rule>`. |

**HTTP status** carries the class of failure (400 validation, 401 auth, 404 not found, 409 conflict, 422 form-rule validation or booking rules, 500 unexpected). **`500`** uses `common.internal_server_error`; details are server-side only.

For authorization failures, user-facing modules return **403** with **`common.forbidden`**.

**Which `code` applies for each route and status** — in **Swagger** / OpenAPI, open the operation and read the **Description** (look for **Error codes**). The JSON **Example Value** for errors is a generic shape only; rely on `error.code` from the real response or the documented list.

---

## 4. Booking status lifecycle

```
confirmed ──→ checked_in ──→ checked_out
    │
    └──→ canceled
```

| Transition | Endpoint |
|------------|----------|
| → `checked_in` | `PUT /api/bookings/{id}/check-in` |
| → `checked_out` | `PUT /api/bookings/{id}/check-out` (optional body `{"force_unpaid": true}`) |
| → `canceled` | `PUT /api/bookings/{id}/cancel` |

Invalid transitions → **422** with `booking.invalid_status_transition` (see Swagger).  
`PUT /api/bookings/{id}` is allowed in `confirmed` and `checked_in` only.

**Check-out billing flow:** the check-out endpoint validates the booking balance before proceeding:
- Balance ≤ 0 → check-out succeeds; Pricing reactively closes the bill.
- Balance > 0, no `force_unpaid` → **409** `booking.outstanding_balance` with `outstanding_balance` in the error response. Frontend should display the amount and offer a "force check-out" toggle.
- Balance > 0, `force_unpaid: true` → check-out succeeds, **bill stays open** (debt visible in folio).

**Optimistic concurrency:** **409** with `booking.concurrent_modification` — re-fetch booking or form and retry (Swagger lists this on the relevant writes).

**Room availability and concurrent writers:** `POST /api/bookings` and `PUT /api/bookings/{id}` (when dates or rooms change) can return **409** with `booking.overbooking` if nothing is available for the requested room type and stay window. That includes **races**: two sessions (e.g. front desk + OTA) can both see a free room, but only the first commit wins. The backend re-checks allocation right before commit and enforces non-overlapping **active** stays per physical room at persistence time, so the reservation grid and booking list stay aligned with what actually committed—there is no “event saved but grid out of date” split for those writes. **Client hint:** treat `booking.overbooking` like a lost race—reload availability (`GET /api/bookings/grid`, property availability helpers, etc.) and ask the user to adjust dates, room type, or specific room, then retry.

---

## 5. FormDSL integration

The API uses an in-house **FormDSL** (see **`docs/forms-dsl.md`**) for org-level **definitions**. **Companion data** (what the user edits) is separate: **guest, employee, and booking detail** endpoints return flat JSON plus **`_form`: `{ id, hash }`** for cache keys. Fetch **`GET …/form?target=…`** for **`definition`** + **`hash`**, then merge **data** from the detail response on the client.

### 5.1 Core ideas

- **`definition`:** a single JSON tree (layout nodes: `stack`, `group`, `array`, inputs, `select`, `button`, etc.) with dot-path **`bind`** into the companion data object.
- **Tree JSON keys:** layout children live under **`children`**; **`array`** row template is **`child`**; **`select`** uses **`items`** only for options (never for layout children). Field constraints use **`rules`** (e.g. `required`, `min_length`). **`options`** is strict: **`placeholder`**, **`locked`**.
- **`FormResponse`:** `GET …/form` and `GET …/form/definition` return **`definition`** + **`hash`** (no embedded data).
- **Labels:** `label` / `title` / select option labels may be literals or **i18n key paths** (e.g. `fields.checkIn`). Injected room-type select options use **literal** names from the property module.
- **Writes:** **POST/PUT** guest profile, **POST/PUT** employee profile, and **POST/PUT** booking validate the body against the org form (or embedded default). Mismatch → **422** with **`common.validation_failed`** and **`error.issues[]`** (see §3). The client should still run FormDSL for UX; the backend enforces declared **`rules`** and array **`min_items`** / **`max_items`** where present. **POST booking** with inline **`guest`** (no **`guest.id`**) additionally applies guest-module invariants (names, at least one of **`email`/`phone`**); those failures use the same **422** envelope with **`guest.*`** paths in **`issues`** (the persisted booking form’s guest group is often empty because fields are injected at read time).

### 5.2 `options.locked`

`options.locked: true` marks nodes the org must not remove or structurally break when customizing forms; the API enforces invariants on `PUT` (core binds and groups — see Swagger / handler errors).

### 5.3 Editor vs runtime (guest, employee, and booking)

| UI purpose | Guest | Booking |
|------------|--------|---------|
| **Form editor** | `GET` / `PUT /api/guests/form/definition` | `GET` / `PUT /api/bookings/form/definition` |
| **Runtime (compiled)** | `GET /api/guests/form?target=edit\|view` | `GET /api/bookings/form?target=edit\|view` (**org + hotel** JWT) |
| **Detail data** (merge with runtime) | `GET /api/guests/{id}` — profile JSON + **`_form`** | `GET /api/bookings/{id}` — **`{ guest, booking }`** + **`_form`** |

Employees follow the same contract shape as guests:

| UI purpose | Employees |
|------------|-----------|
| **Form editor** | `GET` / `PUT /api/employees/form/definition` |
| **Runtime (compiled)** | `GET /api/employees/form?target=edit\|view` |
| **Detail data** (merge with runtime) | `GET /api/employees/{employee_id}` — profile JSON + **`_form`** |

**Employee list contract:** `GET /api/employees` returns only public summary fields needed for list rendering (`id`, `email`, `first_name`, `last_name`). It accepts optional `search` to match first name, last name, or email. It does not expose auth identity ids, tenancy ids, hotel-link data, or permission override data.

**Employee identity note:** employee profile `email` is form data used by HR and operations screens. It is not automatically kept in sync with `iam.users.email` after bootstrap provision. Only the internal hotel-creation provision flow seeds the initial employee profile email from the auth user identity; later employee create/update requests use the submitted form data and do not mutate auth-user email implicitly.

**Account contract:** `GET` / `PUT /api/account` return `{ account, profile, settings, permissions }`, where `account.email` is auth identity data, `profile.first_name` / `profile.last_name` come from the employee profile when available, and `permissions` is the resolved authenticated actor permission tree for the current request context.

**RBAC contract:** occupation templates are managed separately from employee profile JSON.

- `GET /api/occupations` returns all allowed role families as stable `role_key` values plus `role_title_i18n_key`, with current occupation templates grouped under each role. Empty groups are included so the frontend can render all valid create targets without guessing missing roles.
- `POST /api/occupations` creates an organization occupation template.
- `GET` / `PUT` / `DELETE /api/occupations/{occupation_id}` manage one template.
- `GET /api/employees/{employee_id}` returns the flat employee profile JSON plus `occupation_ids`, resolved `occupations`, sparse `permission_overrides`, `effective_permissions`, and `_form`.
- `PUT /api/employees/{employee_id}/occupations` replaces linked occupation template ids for an employee.
- `PUT /api/employees/{employee_id}/permissions` replaces sparse permission overrides stored on the employee's primary `iam.employees_hotels` link. The primary hotel link is `employee.hotel_id` when set, otherwise the first linked hotel.

**Permission model:** QonaqDash uses a hospitality-oriented matrix close to the staff reference project:

- Areas: `bookings`, `guests`, `billing`, `pricing`, `hotel`, `rooms`, `employees`, `housekeeping_tasks`, `maintenance_tasks`.
- Booking actions: `view`, `create`, `operate`, `modify`, `cancel`.
- Guest actions: `view`, `create`, `modify`, `block`.
- Billing actions: `view`, `collect_payment`, `modify`, `refund`.
- Pricing actions: `view`, `manage`, `adjust`.
- Hotel actions: `view`, `manage`, `manage_occupations`, `manage_permissions`.
- Room actions: `view`, `create`, `manage` (governs availability / housekeeping / maintenance axis writes and room activity audit).
- Employee actions: `view`, `manage`, `delete`.
- Housekeeping-tasks actions: `view`, `create`, `operate`, `assign`.
- Maintenance-tasks actions: `view`, `create`, `operate`, `assign`.
- Levels: `0 = none`, `1 = owned`, `2 = hotel`, `3 = organization`.
- **`owned` level is only meaningful on `housekeeping_tasks.*` and `maintenance_tasks.*`.** The server clamps `owned` to `none` for every other area (bookings, guests, billing, pricing, hotel, rooms, employees), so a role configured with e.g. `bookings.view = owned` behaves exactly like `bookings.view = none` — the UI must treat it as "no access". Level assignments for task scopes are the only place where `owned` changes behavior.
- On `housekeeping_tasks` and `maintenance_tasks`, `owned` means **the acting employee created the task or is currently assigned to it**. Hotel/organization levels see every task in scope as before. See §11.5 for how this shapes list/detail/operate/assign responses.
- Effective permissions are computed as: merged occupation base by per-action max, then employee override replacement per provided action.

**Role metadata:** role families are code-defined and returned as stable machine keys plus frontend i18n keys. Occupation `title` remains organization-defined text; role display text should use `role_title_i18n_key`.

### 5.3A Frontend permission rules

Use the IAM permission tree for **UI composition**, but align it with the actual bounded-context behavior below.

| Module / operation family | Primary permission(s) for UI | Notes |
|---------------------------|------------------------------|-------|
| **Property** hotel read | `hotel.view` | Hotel settings/detail screens |
| **Property** hotel update | `hotel.manage` | Hotel settings writes |
| **Property** rooms / room types read | `rooms.view` | Lists, detail, availability, room activity |
| **Property** rooms create | `rooms.create` | Create room / room type |
| **Property** rooms update/delete | `rooms.manage` | Room and room type writes; availability / housekeeping / maintenance axis writes |
| **Tasks** list/detail (housekeeping) | `housekeeping_tasks.view` | Housekeeping task pool |
| **Tasks** create (housekeeping) | `housekeeping_tasks.create` | Create housekeeping tasks |
| **Tasks** status change (housekeeping) | `housekeeping_tasks.operate` | Move housekeeping tasks through lifecycle |
| **Tasks** assign (housekeeping) | `housekeeping_tasks.assign` | Assign housekeeping tasks to employees |
| **Tasks** list/detail (maintenance) | `maintenance_tasks.view` | Maintenance task pool |
| **Tasks** create (maintenance) | `maintenance_tasks.create` | Create maintenance tasks |
| **Tasks** status change (maintenance) | `maintenance_tasks.operate` | Move maintenance tasks through lifecycle |
| **Tasks** assign (maintenance) | `maintenance_tasks.assign` | Assign maintenance tasks to employees |
| **Guest** guest list/detail | `guests.view` | Includes profile reads |
| **Guest** guest create | `guests.create` | Direct guest creation screens only |
| **Guest** guest update / form-definition editor | `guests.modify` | Includes guest form editor |
| **Guest** guest delete/block | `guests.block` | Delete action |
| **Booking** create | `bookings.create` | New reservation flow |
| **Booking** update | `bookings.modify` | Edit reservation |
| **Booking** check-in / check-out | `bookings.operate` | Front desk operations |
| **Booking** cancel | `bookings.cancel` | Cancel action |
| **Booking** read/list/grid/detail | `bookings.view` | Also available to some operational actors; see below |
| **Booking** form editor | `hotel.manage` | Booking form-definition editor is admin/configuration, not reservation operation |
| **Pricing** base rates / rules read | `pricing.view` | Pricing admin screens |
| **Pricing** base rates update | `pricing.adjust` | Rate adjustment |
| **Pricing** pricing rules create/update/delete | `pricing.manage` | Rule management |
| **Billing** reports / ledger / overview | `billing.view` | Billing/admin reporting |
| **Billing** collect payment | `billing.collect_payment` | Payment actions |
| **Billing** manual adjustments / close bill | `billing.modify` | Folio modifications |
| **Billing** refunds | `billing.refund` | Refund actions |

### 5.3B Workflow-aware exceptions

These exceptions are intentional. Frontend should **not** over-restrict them.

| Workflow | What to allow in UI | Why |
|----------|---------------------|-----|
| **Create booking with inline guest creation** | A user with `bookings.create` may still complete booking creation even without `guests.create` | Guest creation in this path is owned by the booking workflow |
| **Accommodation quote during booking flow** | A user with `bookings.create` or `bookings.modify` may access pricing quote flows even without `pricing.view` | Quote retrieval is part of reservation work, not only pricing admin |
| **Booking read/detail/list/grid for operational staff** | A user with `bookings.modify`, `bookings.operate`, or `bookings.cancel` may still need booking reads even without plain `bookings.view` | Read access is bundled into operational reservation workflows |
| **Billing bill/balance reads for operators** | A user with `billing.collect_payment`, `billing.modify`, or `billing.refund` may still read bill/balance screens even without plain `billing.view` | Operators need folio context to perform the allowed action |
| **Guest bookings history** | A user with `bookings.view` may access guest stay history even without `guests.view` | This supports booking-oriented workflows launched from guest context |
| **Flag room dirty / required maintenance during booking ops** | A user with `bookings.operate` may mark a room `dirty` (`PUT /api/property/rooms/{id}/housekeeping` with `status: "dirty"`) or `required` (`PUT /api/property/rooms/{id}/maintenance` with `status: "required"`) even without `housekeeping_tasks.create` / `maintenance_tasks.create` | Front-desk staff raise these flags during the reservation workflow (e.g. a guest reports a problem at check-out); owning the underlying task pool is a separate responsibility. Other housekeeping/maintenance target statuses (`cleaning`, `inspection`, `clean`, `under_maintenance`, `none`) still require the task scopes. |

**Form compilation:** forms are compiled at save time (`PUT …/form/definition`) into separate **view** and **edit** variants. The `GET …/form?target=` endpoint serves the pre-compiled form. Guest fields and room-type options are still injected at runtime on top of the compiled tree.

**Booking `target=edit`:** compiled form with **`disabled_when`** on the guest group pre-baked + guest fields injected at runtime (binds prefixed with `guest.`) + **Clear selection** button + hotel **room-type** rows on the **`room_type`** select. **`target=view`:** compiled clean form + guest field merge + room types (no disable rule or Clear button). **`guest.id`** lives only in **data**, not as a form node. Omit `target` → `edit`.

**Guest `target`:** `edit` | `view` — same compiled output today; omit → `edit`.

**Persisted editor JSON:** **`GET …/form/definition`** returns the raw authoring definition for the org (no runtime injections or compilation).

### 5.4 Runtime booking merge (summary)

Responses from **`GET /api/bookings/form`** do not embed **data**. The client builds the companion object from **`GET /api/bookings/{id}`** (for a new booking, start empty or partial; use **`guest.id: null`** when unlinked for condition evaluation). Submit body remains flat **`{ guest, booking }`**; link an existing profile **only** via **`guest.id`**.

### 5.5 Conditions and actions (client)

FormDSL uses **`visible_when`**, **`hidden_when`**, **`enabled_when`**, **`disabled_when`** on nodes, and **`button`** / input **`actions`** (e.g. `clear_value`). The client evaluates conditions against the **companion data** object using the same **`bind`** path rules as fields — see **`docs/forms-dsl.md`**.

### 5.6 Defaults

If no custom form exists, the platform falls back to its built-in default guest, employee, and booking forms. Detail responses may add display-only keys such as `roomType_label` / `roomID_label` next to ids (aligned with FormDSL `label` semantics) — see Swagger models.

### 5.7 Form caching (`hash`, `ETag`, `_form`)

- **`hash`:** short hex fingerprint of the org’s **persisted** definition JSON. Returned on **`GET …/form`**, **`GET …/form/definition`**, and inside **`_form.hash`** on guest/booking detail payloads. Changes on every successful **`PUT …/form/definition`**.
- **HTTP validation:** send **`If-None-Match`** — **`304 Not Modified`** when unchanged. **`GET …/form`** and **`GET …/form/definition`** use **`ETag: "{hash}"`** (`target` only affects **`…/form`**).
- **Product narrative:** see **`docs/forms-caching.md`**.

### 5.8 Pricing-rule relation to booking form

Pricing rules derive their property candidates from the **org-level booking form definition**. Rules stay **hotel-scoped**, but property conditions reference stable booking form field ids instead of a separate pricing-dimension entity.

- v1 property conditions are sourced from finite-choice booking form fields (starting with `select`).
- **Validation on write:** rule create/update rejects property conditions that reference a `field_id` absent from the current condition index (`pricing.pricing_rule_condition_field_not_found`) or a `value` not in the field's options (`pricing.pricing_rule_condition_value_not_found`).
- **Automatic invalidation on form change:** when `PUT /api/bookings/form/definition` saves a new form, the backend re-indexes condition candidates and then validates all `active`/`disabled` rules across every hotel in the org. Rules whose property conditions reference a removed field or option are set to `status: "invalid"` with a structured `invalid_reason`. Already-`invalid` rules are left as-is (no auto-reactivation).
- `invalid` rules remain visible in the admin UI for repair and are skipped by pricing.
- **Re-activation:** updating a previously `invalid` rule with valid conditions clears `invalid_reason` and restores the user-requested status (`active` or `disabled`).
- **`invalid_reason` shape:** `{ code, message, field_id, condition_index?, details? }`. v1 codes: `field_deleted` (referenced field no longer exists in the form), `select_option_removed` (referenced select value was removed). `condition_index` is the zero-based index into the rule's `conditions[]` array that is broken. Use `code` as the stable UI key for warning badges.

---

## 6. Pricing configuration (admin)

The **Pricing** bounded context exposes its HTTP API under **`/api/pricing/`** (not under property). All payloads, error codes, and field descriptions are in Swagger; this section explains the product relationship between booking forms and pricing rules.

| Entity | Purpose | Key constraint |
|--------|---------|----------------|
| **Pricing rule** | IF-THEN block with typed conditions and effect (percent/fixed, per-night/total). Conditions may target booking-form properties, one explicit date, or an inclusive date range. | `priority` unique per hotel; lower = first applied |

**Admin surface:** the settings UI with three panels — **Base Rates** (`GET` / `PUT /api/pricing/base-rates`, bulk edit per room type), **Condition Candidates** (`GET /api/pricing/conditions`, hotel-scoped response; see §6.1), and the **Rules Builder** (CRUD under `/api/pricing/rules`). The admin creates hotel-scoped rules, but property-condition candidates combine a synthetic **`room_type`** row (same room-type list as the booking form runtime) with fields from the org-level booking form index. The typed condition model is described by the pricing API contract and the rules section below.

### 6.1 Condition candidates

`GET /api/pricing/conditions` requires **org + hotel** context (same JWT as other `/api/pricing/*` routes). The JSON array is **`room_type` first** (synthetic `select` with bind `room_type`, options = “any” plus this hotel’s active room types from Property — same source as booking form injection), then all **indexed** booking-form selects (persisted definition walk). The top-level **`hash` / `ETag`** reflects only the stored org index (booking form shape), not edits to the hotel’s room-type catalog, so clients can keep caching on form changes without a separate room-type version.

**Indexing lifecycle (stored index, excludes runtime injection):**

1. At startup the backend pre-computes the condition index from the embedded default `booking.json` — this provides a stable default `hash` for caching from the first request.
2. When an admin saves the booking form definition (`PUT /api/bookings/form/definition`), the backend re-indexes synchronously (via `FormChangeListener` → `ConditionIndexer`) and stores the result in `pricing.condition_index`.
3. For orgs that have not saved a custom form, the handler falls back to the pre-computed default index before prepending `room_type`.

**Indexing rules (v1) for persisted fields:**

- Eligible node types: `select` (extend as new input types become valid condition sources).
- Excluded: nodes with `options.locked = true` (system fields like `room_type`, `room_id` — `room_type` is still exposed via the synthetic prepend above).
- Excluded: all nodes inside the `guest` group (guest fields are injected at runtime and are not part of the persisted booking definition).
- Each candidate: `{ field_id, type, label, bind, options }`.

**Rule invalidation after form save** uses the stored index plus a minimal synthetic `room_type` row so rules keyed on `field_id: "room_type"` are not treated as `field_deleted`; option-level invalidation for room-type UUIDs is intentionally not tied to property catalog changes (see §5.8).

**Caching:** the `hash` changes whenever the condition index changes. Send `If-None-Match: "<hash>"` → **304 Not Modified** when unchanged. Use `hash` alongside the form `hash` to detect when the rules builder needs to refetch candidates.

**Usage by rules builder:** when an admin picks `property` as the condition type, present the candidates from this endpoint as a dropdown. `field_id` maps to `conditions[].field_id` on rule create/update; select options become valid `value` for `eq` / `not_eq` operators.

### 6.2 Pricing permission note for frontend

Do not gate all pricing endpoints behind `pricing.view`.

- **Pricing admin/configuration** screens should use `pricing.view`, `pricing.adjust`, and `pricing.manage` as described above.
- **Booking quote / accommodation preview** flows should remain available to users who can create or modify bookings, even if they are not pricing administrators.
- If the frontend has both a standalone pricing area and quote widgets embedded in booking screens, treat them as **different permission surfaces**.

---

## 7. Billing permission note for frontend

Do not model Billing as “read requires `billing.view`, write requires something else”.

- Cashier/front-desk users with `billing.collect_payment` still need bill and balance context.
- Refund-capable users with `billing.refund` still need bill and balance context.
- Back-office users with `billing.modify` still need bill and balance context.
- Pure reporting/ledger/report pages are still a `billing.view` surface.

This distinction is important when deciding whether to hide the folio screen entirely versus hiding individual actions inside that screen.

### 6.2 Rules

**Rule payload shape (summary):**

- `name`, `priority`, writable `status`, `conditions[]`, `effect`
- response-only metadata: `id`, `created_at`, `updated_at`, `invalid_reason`
- v1 condition families: `property`, `specific_date`, `date_range`
- v1 property operators: `eq`, `not_eq` (both use `value`)

**Invalidation semantics:** rules are hard-deleted only when explicitly deleted. If a booking form change breaks a rule reference, the rule remains stored but becomes `invalid` with `invalid_reason` until repaired by the admin (see §5.8 for codes and re-activation flow). The frontend should treat `invalid_reason.code` as the stable UI key for warning badges and repair prompts.

### 6.3 Adjustment sources

The pricing engine supports three sources of price adjustments, unified under a common effect shape (`type`, `value`, `apply_to`):

| Source | Who creates | When applied | `source` value |
|--------|------------|-------------|----------------|
| **Rule** | Admin configures in Pricing Rules UI | Automatically when rule conditions match | `rule` |
| **Manual** | Admin enters on a specific booking | Always — no condition check, attached to that booking | `manual` |
| **System** | System resolves from guest attributes (e.g. badges) | Automatically when preconditions met (stub for now) | `system` |

All three produce the same adjustment shape in quote responses and accommodation snapshots: `{ source, source_id?, name, type, value, apply_to, amount }`. The `source` field tells the client how to render the adjustment (e.g. rule name vs. admin text vs. system label). `source_id` is populated only for rule-sourced adjustments (the pricing rule UUID); it is `null` for manual and system sources.

### 6.4 Stay quote (pricing preview)

`POST /api/pricing/quote` accepts stay parameters and returns a night-by-night pricing breakdown with base rates and adjustments from all sources. The endpoint is hotel-scoped (requires hotel context in JWT).

**Purpose:** lets the booking form preview the computed price before creation or after editing dates/rooms/form fields. The same pricing engine runs automatically when bookings are created or updated — results are persisted in **`pricing.booking_quotes`** (see §7.1), not on the booking aggregate.

**Request shape:** `{ booking_id?, check_in, check_out, rooms, booking_data?, guest_id?, manual_adjustments? }`:

- `booking_id` — optional booking UUID. Send it when previewing or editing an **existing** booking so pricing can align with stored state in the future (e.g. locked prices). Omit for new bookings.
- `booking_data` — optional full booking payload JSON for property condition evaluation.
- `guest_id` — optional guest UUID; when provided, the engine resolves system adjustments from guest attributes (currently a stub returning no adjustments; will activate when guest badges are implemented).
- `manual_adjustments` — optional array of `{ name, effect: { type, value, apply_to } }` for admin-entered corrections.

**Response shape:** `{ nights: [{ date, room_type_id, base_rate, adjustments, subtotal }], nights_subtotal, total_adjustments, grand_total }`. Each adjustment carries `source` (`rule` | `manual` | `system`), optional `source_id`, `name`, `type` (percent/fixed), `value`, `apply_to`, and `amount` (actual delta in minor currency units).

**Evaluation order:**

1. For each night × room: base rate → per_night rules in priority order (compound/cascading) → per_night extra adjustments (manual + system, unconditional, compound).
2. Sum all night subtotals → `nights_subtotal`.
3. Apply total-scope rules in priority order (compound) → total-scope extra adjustments (manual + system, compound) → `grand_total`.
4. `ROUND_HALF_UP` after each rule application.

Only `active` rules are evaluated; `disabled` and `invalid` rules are skipped. Extra adjustments (manual/system) are always applied unconditionally after rules.

**Client integration:** call the quote endpoint whenever stay parameters change (dates, rooms, booking-form field values, or manual adjustments). Display the breakdown alongside the booking form. Use `name` for labels, `source` for styling/grouping, and `amount` for display values, formatted with the hotel `currency`.

---

## 7. Reservation grid (product / UX)

The grid is the main booking calendar: rooms on one axis, dates on the other.

| Need | Typical API (details in Swagger) |
|------|----------------------------------|
| Bars / occupancy | `GET /api/bookings/grid?from=&to=` (`YYYY-MM-DD`; rows overlap that window by `check_in` / `check_out`) |
| Room rows | `GET /api/property/rooms` |
| Grouping by type | `GET /api/property/room-types` |

**Layout:** the grid returns unified `BookingItem` objects — rooms are nested under `stay.rooms[]`. One row per physical room (grouped by type) on the client. Guest names are denormalized in the `guest` object.

**Suggested interactions:** empty cell → create with pre-filled dates/room; bar → detail; resize/drag → `PUT /api/bookings/{id}`; changing range → reload grid.

### 7.1 Accommodation pricing snapshot

When a booking is created or updated, the **Pricing module** reactively calculates a quote (using the same engine as `POST /api/pricing/quote`) and stores it in `pricing.booking_quotes` as a JSON **snapshot**. The snapshot includes adjustments from all three sources (rule, manual, system) — see §6.3 — plus a top-level **`manual_adjustments`** field with the raw admin inputs for round-tripping in the UI. Pricing data is **not** part of the booking event stream or booking read models.

**Manual adjustments on booking create/update:** the booking write body may include an optional top-level `adjustments` array alongside `guest` and `stay`:

```json
{
  "guest": { "id": "..." },
  "stay": { "check_in": "...", "check_out": "...", "rooms": [...] },
  "adjustments": [
    { "name": "Campaign winner", "effect": { "type": "percent", "value": -1000, "apply_to": "total" } }
  ]
}
```

The booking module **does not persist** `adjustments` in stored booking data; it forwards them to Pricing, which stores them inside the quote snapshot. **`GET /api/bookings/{id}`** does **not** return `adjustments` or `accommodation` — fetch pricing from Pricing.

**Where to read the stored snapshot:** `GET /api/pricing/bookings/{bookingId}/quote` returns the persisted snapshot JSON (**404** `pricing.not_found` if no quote exists yet — same code as in OpenAPI for this operation). Use this for any UI that needs the accommodation breakdown for a booking (including **`confirmed`** before check-in). After check-in, the **billing folio** is the operational source for charges; the stored quote may still be useful for context until you standardize on bill-only views.

**Booking responses (no embedded pricing breakdown):**

| Endpoint | Pricing-related fields |
|----------|------------------------|
| `POST /api/bookings` / `PUT /api/bookings/{id}` | Unified `BookingItem` has **no** `accommodation` — use `GET /api/pricing/bookings/{id}/quote` after write if you need the snapshot. |
| `GET /api/bookings/{id}` | **No** `accommodation`, **no** `adjustments` — only `{ guest, stay, … }` + `_form`. |
| `GET /api/bookings` (list) | `outstanding_balance` only |
| `GET /api/bookings/grid` | `outstanding_balance` only |

List and grid endpoints include `outstanding_balance` — the current amount owed on the booking (updated by the billing projector after every balance-mutating operation).

**Snapshot shape (stored / quote GET):** same line-by-line structure as the quote preview response: `nights[]`, `nights_subtotal`, `total_adjustments[]`, `grand_total`, `version`, `calculated_at`, plus optional **`manual_adjustments`** (raw inputs). Each line adjustment carries `source`, optional `source_id`, `name`, `type`, `value`, `apply_to`, `amount` (see §6.3). `version` increments on each re-quote; `calculated_at` is UTC.

**Non-blocking:** if pricing fails (e.g. no base rates configured), the booking is created/updated successfully but no row exists in `pricing.booking_quotes` until a later successful quote — `GET …/quote` returns 404 until then.

**Client integration:** display `outstanding_balance` with the hotel `currency` (`GET /api/property/hotel`). For accommodation breakdown and manual-adjustment round-trip, call **`GET /api/pricing/bookings/{bookingId}/quote`**. For live folio after check-in, use **`GET /api/billing/bookings/{bookingId}/bill`**. Use `version` on the snapshot for staleness if you cache it client-side.

### 7.2 Billing — guest bills and ledger

When a booking is checked in (`PUT /api/bookings/{id}/check-in`), the **Pricing module** reactively **opens a guest bill** (via `BillService`) and materializes the accommodation snapshot into append-only **ledger entries**. The billing module lives under `/api/billing/`.

**Bill lifecycle:**

| Booking status | Billing state | What the client shows |
|---------------|--------------|----------------------|
| `confirmed` | No bill exists | Provisional total from **`GET /api/pricing/bookings/{bookingId}/quote`** (or quote preview while editing) |
| `checked_in` | **Open** guest bill + ledger entries | Live folio: charges, adjustments, outstanding balance |
| `checked_out` | **Closed** guest bill | Final folio, read-only |

**Materialization at check-in:** the snapshot's night-level base rates become `accommodation_night` entries. Adjustments are materialized with `entry_type` mapped from their `source`: `rule` → `rule_adjustment`, `manual` → `manual_adjustment`, `system` → `system_adjustment`. `description` carries the adjustment `name`. `SUM(balance_delta)` over all entries equals the snapshot's `grand_total`. Positive `balance_delta` = guest owes more; negative = balance reduced (discounts, payments). This is orchestrated by Pricing's `BookingChangeListener` reacting to the `BookingCheckedIn` event.

**Accommodation resync after check-in:** when a checked-in booking is updated (dates, rooms, or pricing change), the **Pricing module** detects the quote diff and produces **bill adjustment entries** via `BillService.AdjustAccommodation`. The adjustment reflects the net delta between the old and new quotes.

- **Added nights:** materialized identically to check-in — `accommodation_night` + individual adjustment entries (`rule_adjustment`, `manual_adjustment`, `system_adjustment`).
- **Removed nights:** negative (credit) entries of the same types, reversing the original charges.
- **Changed nights** (base rate or adjustments differ): a single `accommodation_correction` entry with the net delta for that night.
- **Total adjustment delta:** a single `accommodation_correction` if the sum of total-level adjustments changed.

**Endpoints:**

| Endpoint | Purpose |
|----------|---------|
| `GET /api/billing/bookings/{bookingId}/bill` | Bill header + all entries + outstanding balance. **404** if no bill yet. |
| `GET /api/billing/bookings/{bookingId}/balance` | Booking-level balance (pre- or post-bill). Returns `{ balance, has_bill }`. |
| `POST /api/billing/bookings/{bookingId}/adjustments` | Manual charge (positive) or credit (negative). Requires open bill. |
| `POST /api/billing/bookings/{bookingId}/payments` | Record a payment. Works pre-check-in (deposit) and post-check-in. Returns `{ entry, balance }`. |
| `POST /api/billing/bookings/{bookingId}/refunds` | Record a refund reversing a prior payment. Returns `{ entry, balance }`. |
| `PUT /api/billing/bookings/{bookingId}/bill/close` | Close the guest bill. Returns `{ bill }` with `status = "closed"`. |

**Pre-check-in deposits:** payments can be recorded before check-in. The ledger entry is stored with `guest_bill_id = NULL`; at check-in, these entries are backfilled to the new bill. Use `GET .../balance` to show the pre-check-in deposit balance; `has_bill: false` indicates no bill exists yet.

**Payment and refund flow:** `POST .../payments` accepts `{ amount, description? }` — amount is the positive sum received; stored as negative `balance_delta`. `POST .../refunds` accepts `{ amount, reverses_entry_id, description? }` — amount stored as positive `balance_delta` (undoes a payment). Both return the updated booking-level balance.

**Bill close:** `PUT .../bill/close` marks the bill as closed manually. A bill may close with non-zero balance (outstanding debt). No further entries can be added to a closed bill. Additionally, fully-paid bills are **auto-closed** by the Pricing module on successful check-out (see above).

**Refund cap:** each refund validates that the cumulative refunded amount for the referenced payment does not exceed the original payment. Error: `billing.refund_exceeds_payment` (409).

**Entry types (v1):**

| `entry_type` | Sign | Source |
|--------------|------|--------|
| `accommodation_night` | +/− | Materialized from snapshot at check-in; also for added (+) / removed (−) nights on corrections |
| `rule_adjustment` | +/− | Materialized from snapshot (`source: "rule"`); also for added/removed night adjustments on corrections |
| `manual_adjustment` | +/− | Materialized from snapshot (`source: "manual"`), operator-entered via POST adjustments, or correction entries |
| `system_adjustment` | +/− | Materialized from snapshot (`source: "system"`) or correction entries |
| `payment` | − | Payment recorded via `POST .../payments` |
| `refund` | + | Refund recorded via `POST .../refunds`; `metadata.reverses_entry_id` links the reversed payment |
| `accommodation_correction` | +/− | Net delta for a changed night or total-adjustment shift after check-in |
| `correction` | +/− | Audit correction (future) |

**Folio display (i18n):** system-generated entries (`accommodation_night`, `accommodation_correction`) have an **empty `description`** — build the display label from `entry_type` (use as i18n key, e.g. `billing.accommodation_night` → "Night" / "Ночь") + `metadata.date` (format per locale) + `metadata.room_type_id` (join with room type name for context). `rule_adjustment` entries carry the admin-defined rule name in `description`. `manual_adjustment` entries (from snapshot) carry the operator's label; direct billing `manual_adjustment` entries carry operator free-text. `system_adjustment` entries carry the system label. `payment` entries carry optional operator note in `description`. `refund` entries carry optional note in `description`. Negative `balance_delta` on `accommodation_night` or adjustment entries indicates a credit (removed night). `metadata.date` uses ISO 8601 date-only format (`YYYY-MM-DD`), same as snapshot and grid query parameters.

**Outstanding balance projection:** every balance-mutating billing operation (open bill, adjust accommodation, manual adjustment, payment, refund, close bill) triggers a `BalanceProjector` that updates `booking.reservation_grid.outstanding_balance` — keeping the grid's financial column always current without cross-schema JOINs at query time.

**Client integration:** after check-in, fetch the bill to show a live folio. Use `outstanding_balance` for the summary display. Pre-check-in, use `GET .../balance` to show deposit amounts. Format monetary values with the hotel `currency` from `GET /api/property/hotel`. All amounts are minor currency units (same convention as pricing).

### 7.3 Financial reports

The billing module exposes hotel-wide report endpoints under `/api/billing/reports/`. All endpoints use `organization_id` and `hotel_id` from the JWT (same as other hotel-scoped routes). Date-range endpoints accept `from` (inclusive) and `to` (exclusive) as query parameters in `YYYY-MM-DD` or RFC 3339 format.

| Endpoint | Purpose | Date range |
|----------|---------|------------|
| `GET /api/billing/reports/overview` | Revenue breakdown + payments/refunds + current outstanding total | Required |
| `GET /api/billing/reports/ledger` | Paginated list of all ledger entries for the hotel | Required |
| `GET /api/billing/reports/ledger/daily` | Day-by-day charges, payments, refunds, and net totals | Required |
| `GET /api/billing/reports/ledger/monthly` | Month-by-month charges, payments, refunds, and net totals | Required |
| `GET /api/billing/reports/outstanding` | Open bills with non-zero outstanding balances | Not used |

**Overview** provides a 3-part financial story for the hotel. The response groups fields into logical sections for frontend rendering:

**Section 1 — Charges (period-scoped):** `accommodation`, `rule_adjustments`, `manual_adjustments`, `service_charges`, `corrections` → summed as `total_charges`. Shows what was billed and adjusted.

**Section 2 — Collections (period-scoped + current):** `payments`, `refunds` (period cash flow), plus `total_outstanding` (current sum of all open bill balances — what is still owed). Shows cash received and remaining debt.

Recommended rendering order: charges section first (line items + `total_charges` as bold subtotal), then collections (payments, refunds, outstanding as the bottom line).

**Ledger list** supports additional query parameters: `entry_type` (comma-separated to filter by multiple types, e.g. `entry_type=payment,refund`), `limit` (default 50, max 200), `offset` (pagination).

**Daily breakdown** returns one row per calendar day with `charges` (all revenue types), `payments`, `refunds`, `net`, and `entries_count`. Useful for bar charts or daily activity tables.

**Monthly breakdown** returns one row per calendar month with the same aggregation structure as daily. Useful for trend charts across longer periods.

**Outstanding balances** returns all open guest bills with non-zero balance: `{ bills: [...], total_outstanding }`. Each bill carries `bill_id`, `booking_id`, `guest_id`, `status`, `opened_at`, `total_charges`, `total_payments`, `outstanding`. No date-range filter — always current state.

**Error codes:** `common.invalid_date_range` (400) when `from`/`to` are missing, malformed, or `to` is not after `from`.

**Client integration:** amounts are minor currency units (same as all billing). Format with the hotel's `currency` from `GET /api/property/hotel`. All responses include a `period` object (`{ from, to }` as `YYYY-MM-DD`) for display context (except outstanding, which has no period).

---

## 8. Integration notes

- **Never put `organization_id` / `hotel_id` in bodies** for tenancy — they come from the JWT.
- **Guest** profiles are org-scoped (shared across hotels). **Property** and **booking** data are org + hotel scoped where Swagger marks hotel context.
- **Dates:** RFC 3339 in JSON (e.g. `2026-03-15T14:00:00Z`); local display/timezone is a client concern.
- **IDs:** UUID strings.
- **Booking guest:** `guest.id` set → link existing; omit / null → create inline from nested fields.
- **Rooms:** optional `roomID` → server auto-assigns a free room of that type; none free → **409** `booking.overbooking`.
- **Blocked guests:** `DELETE /api/guests/{id}` blocks the profile; blocked guests remain in `GET /api/guests` and `GET /api/guests/{id}` with `blocked: true`.
- **Currency & monetary values:** `GET /api/property/hotel` returns `currency` (ISO 4217, e.g. `KZT`). All monetary values (`base_rate_minor`, future ledger amounts) are **integers in minor currency units**. Convert to display format using the ISO 4217 exponent (e.g. `1000000` in `KZT` = 10 000.00 ₸ with exponent 2).
- **Hotel hours:** `check_in_hour` / `check_out_hour` on `GET /api/property/hotel` (HH:MM, defaults `14:00` / `12:00`). Editable via `PUT /api/property/hotel`. The `check_out_hour` is used server-side as the close-of-day boundary for billing accommodation corrections.
- **Room-type base rates:** managed via `GET` / `PUT /api/pricing/base-rates` (not on room-type CRUD). Returns `{ rates: [{ room_type_id, base_rate_minor }] }`. New room types start at 0; set the rate in the pricing Base Rates tab. Use the hotel's `currency` for display formatting.

---

## 9. Suggested frontend structure (optional)

Example route map aligned with the API:

```
/auth/login, /auth/invite/:token
/dashboard
/property/hotel, /property/room-types, /property/rooms
/pricing (base-rates, rules, quote preview, booking quote by id — maps to `/api/pricing/...`)
/guests, /guests/:id, /guests/form-settings
/bookings (grid), /bookings/new, /bookings/:id, /bookings/form-settings
/bookings/:id/bill (folio after check-in)
/reports (overview, ledger, ledger/daily, ledger/monthly, outstanding)
```

Reusable pieces: auth guard, FormDSL renderer, form editor, reservation grid (with `outstanding_balance` column from billing projector), guest picker, base-rates editor, condition-candidates loader (with ETag caching), rules builder (property condition picker from candidates, date/range pickers, effect editor), stay quote preview (calls **`POST /api/pricing/quote`** on booking form changes; include **`booking_id`** when editing an existing booking; supports **`manual_adjustments`**), stored snapshot for a booking (**`GET /api/pricing/bookings/{bookingId}/quote`**), manual adjustment editor (name + effect; submit `adjustments` on `POST`/`PUT` booking, load round-trip inputs from snapshot `manual_adjustments`), payment/refund forms (amount + payment method, refund with payment selector), folio view (live bill entries, balance, close bill action, deposit indicator), reports dashboard (date-range picker shared across report tabs, overview summary cards with outstanding indicator, ledger table with multi-type filtering, daily/monthly breakdown charts, outstanding balances table), error toast driven by `error.code` from Swagger-documented responses.

---

## 10. Room model and operational state (Stage 3)

Rooms carry three **independent** operational axes. A single `status` value cannot express all three — do **not** collapse them into one enum on the client.

| Axis | Values | Meaning |
|------|--------|---------|
| **Availability** | `available`, `ooo` | Operator-controlled inventory block. `ooo` removes the room from availability entirely. |
| **Housekeeping** | `dirty`, `cleaning`, `inspection`, `clean` | Indoor readiness. `clean` means "ready after inspection" — a cleaner finishing work transitions to `inspection`, not `clean`. Driven end-to-end by the housekeeping task lifecycle (see §11); the room endpoint is an alias. |
| **Maintenance** | `none`, `required`, `under_maintenance` | Repair state. `required` = planned maintenance task exists but hasn't started. `under_maintenance` requires `maintenance_planned_end` (RFC 3339) and carries `maintenance_note`. Driven by the maintenance task lifecycle (see §11); the room endpoint is an alias. |

Room responses (`GET /api/property/rooms`, `GET /api/property/rooms/{id}`, write responses) include the three axes plus `maintenance_planned_end`, `maintenance_note`, and a `version` field. `version` is the event-sourced aggregate version for optimistic concurrency; clients do not need to send it back today, but it reflects how many operational events have been applied and is exposed so later UIs can show history depth.

The legacy `status` field (`available` / `maintenance` / `out_of_order`) is still returned for backward compatibility. New screens should read the three axes.

### 9.1 Writing room state

Availability is managed directly by the property module. **Housekeeping and maintenance writes are aliases for task management** — each call translates to the equivalent housekeeping/maintenance task lifecycle transition (see §11). They return **204 No Content** on success and surface `tasks.*` error codes (`tasks.invalid_status`, `tasks.invalid_transition`, `tasks.planned_end_required`, `tasks.duplicate_open_task`, `tasks.task_not_found`, `tasks.concurrency_conflict`).

| Axis | Endpoint | Body | Notes |
|------|----------|------|-------|
| Availability | `PUT /api/property/rooms/{id}/availability` | `{ "status": "available"\|"ooo" }` | Requires `rooms.manage`. Returns the room payload on success; **409** `property.concurrency_conflict` on concurrent writes. |
| Housekeeping | `PUT /api/property/rooms/{id}/housekeeping` | `{ "status": "dirty"\|"cleaning"\|"inspection"\|"clean", "description"?: string, "assignee_employee_id"?: uuid\|null }` | Alias for a housekeeping task transition. `description` and `assignee_employee_id` are applied to the resulting task; `assignee_employee_id: null` clears the assignee. |
| Maintenance | `PUT /api/property/rooms/{id}/maintenance` | `{ "status": "none"\|"required"\|"under_maintenance", "description"?: string, "planned_end"?: RFC3339, "note"?: string, "assignee_employee_id"?: uuid\|null }` | Alias for a maintenance task transition. `planned_end` is required when the alias has to create or start a maintenance task (status `required` or `under_maintenance` with no open task). `note` is carried onto the task. |

Housekeeping / maintenance alias authorization follows the task scope, not `rooms.manage`:

- Housekeeping: `housekeeping_tasks.create` (when the alias has to open a task) or `housekeeping_tasks.operate` (when it has to advance an existing one).
- Maintenance: `maintenance_tasks.create` / `maintenance_tasks.operate` with the same split.
- **Booking-operations exception:** `bookings.operate` alone is sufficient for the `dirty` housekeeping target and the `required` maintenance target — the alias opens or updates the underlying task on the actor's behalf without requiring task-admin rights. The other target statuses still demand the task scopes above.

Legacy `PUT /api/property/rooms/{id}` (full room update with the single `status` field) still works for catalog edits (room type, number) and is preserved for existing clients; new clients should not use it to change operational state.

### 9.2 Stay-aware availability (`rooms/available`)

`GET /api/property/rooms/available?from=&to=&exclude=` is the single authoritative source for room selection. Each item in the response carries:

- `state`: one of
  - `selectable` — offerable with no warnings
  - `selectable_with_warning` — offerable but operationally imperfect (see `warnings[]`)
  - `blocked_by_inventory` — `availability_status = ooo` (filtered out unless the UI requests blocked rooms)
  - `blocked_by_maintenance` — `maintenance_status = under_maintenance` and the stay overlaps `planned_end` (filtered out unless the UI requests blocked rooms)
  - `blocked_by_occupancy` — already reserved in the window
- `warnings[]`: string keys for i18n. Current values: `housekeeping.dirty`, `housekeeping.cleaning`, `housekeeping.inspection`, `maintenance.required`, `availability.ooo`, `availability.occupied`, `maintenance.under_maintenance`.

**Front-desk guidance:** a dirty, cleaning, or inspection-pending room remains selectable with a warning — do not hide it from the picker. The server enforces the same rules as the booking write path, so a room marked `ooo` or `under_maintenance` (within the stay window) cannot be assigned even if the client bypasses the UI filter.

### 9.3 Checkout → housekeeping

When `PUT /api/bookings/{id}/check-out` succeeds, the booking module fires the `CheckoutHousekeepingCreator` port (implemented by the tasks module). For each assigned room it opens an auto-created housekeeping task with `source: "auto_checkout"` and `booking_id: <bookingID>`. Creating the task flips the room's housekeeping axis to `dirty` via the normal task → room side effect, so front-desk and housekeeping dashboards see both the dirty room and the open cleaning task immediately. A duplicate open task for the room (already exists) is a no-op — checkout never double-opens a task.

### 9.4 Room activity (audit)

`GET /api/property/rooms/{id}/activity` returns the append-only room event history for audit:

```json
[
  {
    "event_id": "…",
    "event_type": "RoomHousekeepingChanged",
    "version": 4,
    "payload": { "housekeeping": "dirty" },
    "metadata": {
      "employee_id": "…",
      "organization_id": "…",
      "hotel_id": "…"
    },
    "occurred_at": "2026-04-18T10:32:00Z"
  }
]
```

Event types: `RoomAvailabilityChanged`, `RoomHousekeepingChanged`, `RoomMaintenanceChanged`, `RoomMaintenancePlannedEndChanged`. `metadata.employee_id` is the actor who performed the change, resolved from the JWT that authorized the command. Requires `rooms.view`.

---

## 11. Housekeeping and maintenance tasks

Tasks are the handoff between reception, housekeeping, and maintenance. The tasks module is **event-sourced** with two separate aggregates (housekeeping and maintenance), each owning its own stream and read-model table. Room housekeeping and maintenance state is **derived** from the corresponding task lifecycle — the room-status endpoints at `/api/property/rooms/{id}/housekeeping` and `/maintenance` are aliases that delegate into these same commands (see §9.1).

### 11.1 Model

**Housekeeping task**
- Statuses: `open`, `in_progress`, `inspection`, `done`, `cancelled`.
- Transitions: `open → in_progress`, `in_progress → inspection`, `inspection → done`; any non-terminal → `cancelled`. Terminal states cannot transition further.
- Fields: `id`, `room_id`, `status`, `description`, `source` (`manual` | `auto_checkout`), optional `booking_id` (set when `source=auto_checkout`), optional `assignee_employee_id`, `created_by_employee_id`, `updated_by_employee_id`, timestamps, `completed_at`, `cancelled_at`.

**Maintenance task**
- Statuses: `open`, `in_progress`, `done`, `cancelled` (no `inspection`).
- Transitions: `open → in_progress`, `in_progress → done`; any non-terminal → `cancelled`.
- Fields: as above, plus `planned_end` (RFC 3339) and `note` as **task-owned** fields. No `booking_id`.

**Source field:** identifies why the task exists. `manual` = user-initiated (frontend should localize as "Created by {actor}"). `auto_checkout` = opened automatically when a booking checked out (frontend should localize as "Checkout — booking {booking_id}"). No separate i18n key is sent; the `source` value is the i18n hook.

**One open task per (room, domain):** the DB enforces a partial unique index on `room_id` for non-terminal statuses. Attempting to open a second housekeeping or maintenance task for the same room while one is still active returns **409** `tasks.duplicate_open_task`. Idempotency in booking auto-create is handled upstream — a duplicate from checkout is a silent no-op.

There is no shared "tasks" type on the wire anymore; housekeeping and maintenance have distinct endpoints, DTOs, and permission scopes.

### 11.2 Endpoints

**Housekeeping** — scope `housekeeping_tasks.*`.

| Endpoint | Purpose |
|----------|---------|
| `POST /api/tasks/housekeeping` | Create. Body: `{ room_id, description?, assignee_employee_id? }`. Source is always `manual` for client-originated creation; `auto_checkout` is reserved for the checkout listener. |
| `GET /api/tasks/housekeeping` | List. Query: `status`, `room_id`, `assignee`, `unassigned=true`. |
| `GET /api/tasks/housekeeping/{id}` | Get one task. |
| `PUT /api/tasks/housekeeping/{id}` | Partial update. Body: `{ description?, assignee_employee_id? }`. Omit a field to leave unchanged; send `assignee_employee_id: null` to clear. |
| `PUT /api/tasks/housekeeping/{id}/status` | Change status. Body: `{ status }` where `status ∈ {in_progress, inspection, done, cancelled}`. |

**Maintenance** — scope `maintenance_tasks.*`.

| Endpoint | Purpose |
|----------|---------|
| `POST /api/tasks/maintenance` | Create. Body: `{ room_id, description?, planned_end, note?, assignee_employee_id? }`. `planned_end` is required. |
| `GET /api/tasks/maintenance` | List. Query as above. |
| `GET /api/tasks/maintenance/{id}` | Get one task. |
| `PUT /api/tasks/maintenance/{id}` | Partial update. Body: `{ description?, planned_end?, note?, assignee_employee_id? }`. Use `null` to clear `assignee_employee_id` or `planned_end`. Edits to `planned_end`/`note` while the task is `in_progress` propagate to the room automatically. |
| `PUT /api/tasks/maintenance/{id}/status` | Change status. Body: `{ status }` where `status ∈ {in_progress, done, cancelled}`. |

**Error codes (both domains):** `tasks.invalid_status`, `tasks.invalid_transition`, `tasks.invalid_source`, `tasks.room_id_required`, `tasks.planned_end_required`, `tasks.duplicate_open_task`, `tasks.task_not_found`, `tasks.concurrency_conflict`, `tasks.booking_id_forbidden`, plus the common auth codes.

### 11.3 Task → room side effects

Task lifecycle transitions are reflected onto the room operational axes inside the same actor context — fire-and-forget: failures are logged but do not fail the task operation. The room event metadata carries the acting `employee_id` so room activity can attribute the change.

**Housekeeping**

| Task transition | Room effect |
|-----------------|-------------|
| create (`→ open`) | `housekeeping = dirty` |
| `open → in_progress` | `housekeeping = cleaning` |
| `in_progress → inspection` | `housekeeping = inspection` |
| `inspection → done` | `housekeeping = clean` |
| cancel from `open` | no room change |
| cancel from `in_progress` or `inspection` | `housekeeping = dirty` (rewind — work did not complete) |

**Maintenance** (planned maintenance does not mutate room state until it becomes "actual"):

| Task transition | Room effect |
|-----------------|-------------|
| create (`→ open`) | no room change |
| `open → in_progress` | `maintenance = under_maintenance` (carries `planned_end` + `note` from the task) |
| `in_progress → done` | `maintenance = none`, `planned_end` cleared |
| cancel from `open` | no room change |
| cancel from `in_progress` | `maintenance = none` (maintenance ended mid-way) |
| `PUT .../maintenance/{id}` edits `planned_end` or `note` while `in_progress` | room `maintenance` stays `under_maintenance`; the new `planned_end`/`note` propagates to the room |

Because the room axis is derived from tasks, room `required` is only reached through the alias endpoint (`PUT /rooms/{id}/maintenance` with `status: "required"`), which opens an `open` maintenance task without starting it.

### 11.4 Client integration

- Dashboards should filter by `status` and offer an **"Unassigned"** quick filter (`?unassigned=true`). Use the two domain endpoints separately — there is no unified task list endpoint.
- After a checkout, the auto-created housekeeping task is already visible: refetch `/api/tasks/housekeeping?status=open` (or refetch per-room) to pick it up. No client-side create is needed.
- Use `assignee_employee_id = null` on the PUT body to unassign. Same pattern for `planned_end: null` on maintenance.
- The room-status endpoints (`/api/property/rooms/{id}/housekeeping` and `/maintenance`) are valid alternatives to calling the task endpoints directly — pick whichever matches your UI flow (a "Mark clean" button on the room card vs. a "Close task" action on the task row).
- Room activity (`GET /api/property/rooms/{id}/activity`) shows the resulting `RoomHousekeepingChanged` / `RoomMaintenanceChanged` events; `metadata.employee_id` is the task-side actor, so the bridge is traceable without cross-joining task events.

### 11.5 Owned-level permission behavior

The `owned` permission level is applied here (and only here — see §5.3). When an actor's effective level on a task resource/action is exactly `owned`, the backend evaluates per-task ownership against the task's `created_by_employee_id` and `assignee_employee_id`. A task is owned when either equals the actor's `employee_id`.

- **List (`view = owned`):** `GET /api/tasks/housekeeping` and `GET /api/tasks/maintenance` silently restrict results to tasks the actor created or is assigned to. Query filters (`status`, `room_id`, `assignee`, `unassigned=true`) still apply on top of that restriction — there is no separate "owned only" flag in the request.
- **Detail (`view = owned`):** `GET /api/tasks/{domain}/{id}` returns **403** `common.forbidden` when the task is not owned by the actor. No 404 disclosure trick — this is intentional to keep the contract uniform.
- **Operate (`operate = owned`):** status changes and description edits on a task the actor does not own return **403** `common.forbidden`. With `operate ≥ hotel` the actor may drive any task in the hotel pool.
- **Assign (`assign = owned`):** changing `assignee_employee_id` on a task the actor does not own returns **403**. Most teams will pair `assign = hotel` with `operate = owned` — owned-only assign is allowed but rarely useful on its own.
- **Create (`create = owned`):** accepted — the actor becomes the creator, so the task is immediately owned on the next read/operate call. No special client handling needed.

**Frontend hints**

- When the UI sees `view = owned` (and no stronger level elsewhere) on a task scope, it is safe to assume list results are already filtered; do **not** issue an additional client-side "mine" filter against list data from the server.
- Buttons that call `operate`/`assign` on tasks the actor does not own should be disabled to avoid surprising 403s, but still handle the 403 response defensively — assignment can change after the page loads.
- The room-status alias endpoints (§9.1) authorize via these same task scopes, so an owned-only actor can still flip a room's housekeeping axis through the alias **only when they own the underlying task** (or the call has to create one, in which case they become creator).

---

## 12. Feature backlog

Tracked outside this document (issue tracker / product board). When a feature changes the HTTP contract, update **Swagger** (`make swagger`) and adjust this guide only if behaviour or UX semantics change.
