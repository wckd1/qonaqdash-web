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

## Feature Implementation

- **Backend contract**: Implement against **[docs/requirements.md](docs/requirements.md)** as the shipped API and integration contract. **Do not edit `requirements.md` in this repo** — it is maintained by the backend; propose API changes only via **[docs/backend-change-requests.md](docs/backend-change-requests.md)** until they appear in requirements.
- **Design reference**: Align with **[docs/design.md](docs/design.md)** and **[docs/design.html](docs/design.html)** plus tokens in `main.css`. If implementation changes a design decision (sidebar, tokens, patterns), update **both** `docs/design.md` and `docs/design.html` so docs stay authoritative.
- **Backend coordination**: **[docs/backend-change-requests.md](docs/backend-change-requests.md)** is the queue for **outstanding** proposals to the backend team. Keep it accurate: add new items when needed; remove or shrink entries once they are reflected in `docs/requirements.md`.
- **UI work — `/frontend-design` and `/interface-design`**: Use both skills when designing or building UI. **Before treating UI as done**, apply their checks as hard requirements, not optional polish — for example: intent and palette/depth tied to design tokens (not random values); interface-design **swap / squint / signature / token** tests; frontend-design coherence (hierarchy, motion, accessibility). If a check fails, fix the UI before shipping.

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
- **`docs/`**: Design and requirements live here; excluded from app builds. Do **not** reference `docs/*.md` paths inside `src/` comments or JSDoc — contracts stay in docs; code comments stay self-contained.
- **Markdown**: Do not create `.md` files unless the user asks.
- **Quality**: Fix root causes; avoid workaround-only fixes.
- **API errors**: Backend uses `{ "error": "human-readable message" }`. Surface `data?.error`, not `data?.message`, in the client and views.

## Design System Notes

- **Intent** (in `main.css` header): reception/staff, bookings/guests, warm calm teal. New tokens should match that intent.
- **Content / forms**: Full-width content sections; vertical form stacks; labels per global `label` rule. Input/select/textarea value size: **`--text-label-size`** (checkbox/radio excluded); compact toolbars may override locally.
- **UI review**: When using `/interface-design`, ensure component fallbacks match current tokens; avoid layout that fights full-width content; token names should read as product-specific.

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
- **Form route height**: `main.app-main--fit-content` on form/detail routes; flex + `min-height: 0` on the active scroll root (`form-content__viewport` or `.guest-detail-body` per view).
- **HorizontalLayout / builder**: `.form-view-layout--horizontal` children flex; `.form-view-layout__fields` grid; builder `.form-build-shell` spans full grid width. `JsonFormBuild`: max two children per horizontal row; group title behavior for `main` / `field_*` ids per `resolveGroupTitle`.
- **Date-time**: Store RFC 3339; `datetime-local` in UI with conversion in ControlRenderer.
- **Composables**: If returning `{ ref, ref }`, wrap with `reactive()` so templates see unwrapped booleans/arrays, not Ref objects.
- **i18n**: Keys in `src/locales/{en,ru}.json`; `useI18n` / `$t` in components; `i18n.global.t` in non-SFC helpers. New/changed UI strings → both locale files. `pageTitle.*` / router for titles; detail views may set `document.title` from loaded data. Do not hardcode English for server `data.error`. RU: product-appropriate wording, not literal only. In script, don’t shadow `t` from `useI18n()`.
- **Account / locale**: `GET`/`PUT /api/account` per requirements; `useSettingsStore.fetchUserSettings()` after login, invite, and authenticated `App` mount; `setLocale` from account only when locale not pinned; sidebar email from account then JWT.
- **Hints**: Secondary copy under labels: `--text-caption-size`, `--text-caption-weight`.
