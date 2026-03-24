## Feature implementation (definition of done)

Treat **new product behavior**, **API integration changes**, and **visible UI changes** the same: complete the full checklist below in the **same change set** when user-facing behavior, contract assumptions, or design authority shift.

**These items are blocking.** Do not treat implementation as finished after “it works locally” alone. Skipping applicable items is a **process failure**, not an optional follow-up.

1. **Contract (`docs/requirements.md`) (MUST)** — Implement and parse responses against **[docs/requirements.md](docs/requirements.md)** as the shipped API contract. **Do not edit `requirements.md` in this repo** (backend owns it). If the backend must add or change endpoints, payloads, or error behavior to support the frontend, record it in the **same change set** in **[docs/backend-change-requests.md](docs/backend-change-requests.md)** (method/path, params, reason, how the UI will use it). Do not paper over contract gaps in silence. After backend ships updates, **trim or remove** resolved rows from `backend-change-requests.md` so the queue stays accurate. **Skill (when shaping proposals):** **api-design-principles**.

2. **Design authority (`design.md` / `design.html` / tokens) (MUST when UI or product chrome changes)** — Align implementation with **[docs/design.md](docs/design.md)**, **[docs/design.html](docs/design.html)**, and **`src/assets/main.css`** tokens. If you change layout, navigation, interaction patterns, or design decisions reflected in those docs, update **`design.md` and `design.html` in the same change set** so documentation stays authoritative. Prefer tokens over ad-hoc colors/sizing. **Skills (before calling UI done):** **frontend-design** and **interface-design** — run their checks as hard gates (hierarchy, motion, a11y, token/swap/squint/signature tests). **In the same delivery** (assistant response, PR description, or equivalent), include a **short UI check summary**: what you verified, plus gaps or intentional exceptions. Silently skipping this summary for substantive UI work is **incomplete**.

3. **Implementation quality (MUST)** — Match existing feature layout (`src/features/…`, thin stores, feature `api.js`), shared patterns in `src/shared/`, and the conventions in the sections below. **Vue / Router / Pinia work:** follow **vue-best-practices**; use **vue-router-best-practices** and **vue-pinia-best-practices** when routes or stores are involved. **New reusable composables** whose inputs may be refs or plain values: prefer **create-adaptable-composable**. **Substantial or cross-cutting features:** consider **planning** (structured plan under `docs/plans/` when that skill is invoked); if a plan file exists before build-out, **plan-review** can sanity-check it. **Exploration / options:** **brainstorm** when the user wants design or approach discovery before coding.

4. **Build and linters (MUST)** — Run **`npm run build`** and fix failures introduced by the change. If the repo or CI adds ESLint, Prettier, `vue-tsc`, or other checks, satisfy them for **touched files** before considering the work done. **Debugging Vue/runtime issues:** **vue-debug-guides**. **Automated tests** (when present or added): **vue-testing-best-practices** / **test-automator**.

5. **i18n (MUST for new or changed user-visible copy)** — Add or update keys in **`src/locales/en.json` and `src/locales/ru.json`**. Do not hardcode new English UI strings. Server `data.error` stays as returned (do not invent English-only fallbacks that hide API messages).

6. **Learnings (optional)** — When the user asks to capture session knowledge (**learn** skill) or at the end of a significant change, update this **AGENTS.md** if something durable about process or architecture was discovered.

## Tech Stack

- **Frontend**: Vue 3 + Vite + Pinia + Vue Router + Pico CSS
- **Backend**: Go modular monolith, REST JSON API, JWT auth (HS256)

## Architecture

- **Project structure**: Feature-based — `src/features/{auth,property,guests,bookings}/` each with own views, stores, composables; shared code in `src/shared/` (api client, layouts, common components).
- **CSS architecture**: [src/assets/main.css](src/assets/main.css) holds `:root` design tokens and **shared** layout/UI (app shell, lists, side panels, dashboard, forms, dialogs, search, status chips, shared utilities like `.form-error`, `.form-field-error`, `.invite-info`). [docs/design.html](docs/design.html) uses the same CSS plus doc-only layout. **Recurring `main.app-main > …` patterns** (list/dashboard **`__viewport`**, search, **`form-content__viewport`**) stay in **main.css**. **Route-specific** scroll/shell tweaks live in that **view’s `<style scoped>`** with **`:deep()`** where child components need adjustment. Prefer explicit **`__viewport` / body** class names over **`:first-child`** for scroll regions. Avoid duplicating patterns already in `main.css`; use tokens, not ad-hoc hex/rgba/rem.
- **Token storage**: localStorage for access and refresh tokens; migrate refresh to httpOnly cookie when a backend refresh endpoint exists.
- **API client**: Axios with interceptors (JWT, 401 redirect, errors). **Exception:** `PUT /api/account` may return **401** for a wrong current password while the session stays valid — do **not** clear tokens or redirect to login; treat similar endpoints the same way if they appear.
- **Feature API modules**: Each feature has its own `api.js` (e.g. `src/features/auth/api.js`) for HTTP and parsing; stores stay thin and call these modules.
- **API integration**: If the backend should change shape or add endpoints/params to support the frontend properly, say so explicitly (what to return, why). Do not paper over gaps in silence. **Record every proposed backend change in [docs/backend-change-requests.md](docs/backend-change-requests.md)** (method/path, params, reason, how the frontend will use it).

## Feature implementation (quick pointer)

The **blocking checklist** (contract, `backend-change-requests`, design docs + tokens, build/linters, i18n, UI skills + summary) lives at the top: **Feature implementation (definition of done)**.

## UI and UX

- **Design system**: Colors, typography, spacing, and depth live in `main.css` as custom properties; visual reference in [docs/design.html](docs/design.html).
- **Navigation**: Dark collapsible sidebar — Dashboard, Bookings, Guests; **Settings** group (Rooms, guest/booking forms under `/manage/…`). Footer: Profile → `/profile`, Log out. Tokens: `--sidebar-bg`, `--sidebar-text`, `--sidebar-user-menu-bg`, etc. **Guests/Bookings** nav highlights exclude `/manage/guests` and `/manage/bookings` so form editors don’t highlight list items. **Settings** group: closed by default; auto-open only on first load if URL is under `/manage/`, or when entering `/manage/` from outside — not on every hop between manage routes. Narrow rail: Settings trigger hidden; manage links as icons.
- **Interaction pattern**: List or grid → side panel (summary + quick actions) → full page (detail + edit) for bookings and guests.
- **Visual direction**: Cool gray-blue canvas, teal accent (`--brand-primary`); corporate but joyful; generous whitespace. Body: Work Sans; display: Manrope (Latin + Cyrillic). Content area uses `--content-area-gap`, `--content-area-radius`.
- **Booking status colors**: `--status-confirmed`, `--status-checked-in`, `--status-checked-out`, `--status-canceled`.
- **Dashboard grid**: Reservation timeline in `ReservationGrid.vue`. Presets 7/14/30: `localStorage` + `/?from=&to=`. Preset range: **forward-biased** (`from` = yesterday, `to` = today + (n−2)) so **today is the 2nd column**; custom dates still allowed. `DashboardView` range bar: preset select, From/To with min/max, **`@change` reloads** (no Apply); **Today** reapplies current preset from “now”.
- **Bookings vs dashboard**: Grid uses `GET /api/bookings/grid`; Bookings **list** uses `GET /api/bookings` (with `q`). List: row → panel → full detail.
- **Reservation grid behavior**: Room-type bands use tokens (e.g. `color-mix` on `--control-bg` / `--ink-primary`). Keep range highlight while cell context menu is open. **New booking from cells**: multi-day → check-in first day 14:00, check-out last day 12:00; single day → one night, check-out next day 12:00. Dashboard nav icon: layout-dashboard (grid), not a house.

## Conventions

- **Shared components**: Reused UI → `src/shared/` (or appropriate shared path). Keep components token-driven; move duplicated layout from features into `main.css` when it becomes a system pattern.
- **`docs/`**: Design, API contract, and change-request queue live here; excluded from app builds. Files under `docs/` **should** cross-link each other when helpful. Do **not** reference `docs/*.md` / `docs/*.html` paths inside `src/` comments or JSDoc — contracts stay in docs; application code stays self-contained. Procedural pointers to which doc is which remain in this file for agents.
- **Markdown**: Do not create `.md` files unless the user asks.
- **Quality**: Fix root causes; avoid workaround-only fixes.
- **API errors**: Backend uses `{ "error": "human-readable message" }`. Surface `data?.error`, not `data?.message`, in the client and views.

## Design System Notes

- **Intent** (in `main.css` header): reception/staff, bookings/guests, warm calm teal. New tokens should match that intent.
- **Content / forms**: Full-width content sections; vertical form stacks; labels per global `label` rule. Input/select/textarea value size: **`--text-label-size`** (checkbox/radio excluded); compact toolbars may override locally.
- **UI review**: Same bar as **Feature implementation (definition of done)** step 2 — **frontend-design** / **interface-design**; component fallbacks match tokens; avoid layout that fights full-width content; token names should read as product-specific.

## Frontend / Vue

- **Pinia in views**: Use `storeToRefs(store)` when destructuring store state so async updates stay reactive.
- **Pinia — property lists**: `usePropertyStore` idempotently hydrates full `fetchRoomTypes` / `fetchRooms` via flags (not `array.length`). Non-empty `q` clears **both** flags (search can return partial lists).
- **Pinia — form templates**: Guest: runtime `GET /api/guests/form` cached in store; manage schema via `fetchGuestFormSchema` / `PUT …/schema` + `replaceGuestFormTemplate`. Booking: same with booking endpoints and `replaceBookingFormTemplate`. Do **not** cache-skip per-entity `fetchGuest(id)` / `fetchBooking(id)` the same way.
- **Guest/booking lists**: No session skip-cache for list fetches — search and filters break a single “full list” invariant.
- **Router**: Catch-all under main layout for 404 inside shell. **Static routes before dynamic** (e.g. `guests/new` before `guests/:id`). Dashboard/home link: **`router-link-exact-active`** when all routes nest under `/`, so home is not active on every page.
- **Pico**: Margin overrides and new Pico tweaks go in `main.css`. Input outline: `--pico-outline-width` is `0.0625rem` on inputs vs `0.125rem` on root — match custom controls (e.g. search) to inputs.
- **Naming**: Views named for the **screen** (`RoomsView` not `PropertyView` for rooms). Settings/admin routes under **`/manage/`**.
- **Accordions**: Native `<details>` without controlled `:open` when multiple independent open sections are desired.
- **Lists with search**: Match Guests pattern: server `q`, debounce, `initialLoading` vs `searching`, spinner in search bar. Document API gaps in [docs/backend-change-requests.md](docs/backend-change-requests.md). Prefer server-side search, not client-only filtering.
- **List layout**: Search always under page header; below that — error, loading, or content (never hide search on error/empty).
- **Page layout**: `app-layout` → `app-layout-body` → `sidebar` + `main.app-main` with `router-view` in `main`. Each page: `header.page-header` then siblings with `gap: var(--space-md)`. **Lists**: `search` then `section.list-content` (`overflow: hidden`, `position: relative`); scroll in **`list-content__viewport`**; **side panel sibling after** viewport (not inside it). **Forms**: `form-content__viewport` inside JSONForm components. **Dashboard**: `dashboard-body__viewport` then panel. **Guest detail**: `.guest-detail-body` scroll; form + bookings order per `GuestDetailView` / `:deep` rules. **404**: `.not-found` in `main`. `main.app-main` stays `position: relative` for overlays.
- **Avoid extra wrappers**: No redundant wrapper around search. No extra top-level section when JSONForm already sections content. **Keep** intentional scroll roots: `list-content__viewport`, `dashboard-body__viewport`, `form-content__viewport`, `guest-detail-body`, `guest-detail-form`.
- **JSONForm**: Edit stack: `JsonFormEdit`, `edit/LayoutRenderer`, `ControlRenderer`, `ArrayRenderer`; paths in `utils.js`. Payloads camelCase; guest flat, booking `{ guest, booking }`. Booking rules: scopes under `#/properties/guest/...`; no top-level `id` on create/update — `guest.id` only. Detail: Save then Cancel (`.btn-secondary`); Cancel on detail only.
- **JSONForm rules / actions**: `useJsonFormRules.js` (Ajv). Pass **root** data as **`fullData`** into `ControlRenderer` for nested rows when guest-scoped rules apply. Action buttons ignore inherited disable from rules (SHOW/HIDE only) unless you add an explicit whole-form mechanism.
- **Form route height**: `main.app-main--fit-content` on short form/settings routes (new entity, profile, manage forms, hotel); **guest/booking full detail** fills main height (default flex) with inner scroll on `.guest-detail-body` (and booking JSONForm viewport as needed). Flex + `min-height: 0` on the active scroll root. **Modals**: `Teleport` to `body`; `.dialog-backdrop` / `.dialog` are global in `main.css` because `container-type: inline-size` on `main` would otherwise make `position: fixed` cover only `main`.
- **HorizontalLayout / builder**: `.form-view-layout--horizontal` children flex; `.form-view-layout__fields` grid; builder `.form-build-shell` spans full grid width. `JsonFormBuild`: max two children per horizontal row; group title behavior for `main` / `field_*` ids per `resolveGroupTitle`.
- **Date-time**: Store RFC 3339; `datetime-local` in UI with conversion in ControlRenderer.
- **Composables**: If returning `{ ref, ref }`, wrap with `reactive()` so templates see unwrapped booleans/arrays, not Ref objects.
- **i18n**: Keys in `src/locales/{en,ru}.json`; `useI18n` / `$t` in components; `i18n.global.t` in non-SFC helpers. New/changed UI strings → both locale files. `pageTitle.*` / router for titles; detail views may set `document.title` from loaded data. Do not hardcode English for server `data.error`. RU: product-appropriate wording, not literal only. In script, don’t shadow `t` from `useI18n()`.
- **Account / locale**: `GET`/`PUT /api/account` per requirements; `useSettingsStore.fetchUserSettings()` after login, invite, and authenticated `App` mount; `setLocale` from account only when locale not pinned; sidebar email from account then JWT.
- **Hints**: Secondary copy under labels: `--text-caption-size`, `--text-caption-weight`.
