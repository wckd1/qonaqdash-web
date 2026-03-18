## Tech Stack

- **Frontend**: Vue 3 + Vite + Pinia + Vue Router + Pico CSS
- **Backend**: Go modular monolith, REST JSON API, JWT auth (HS256)

## Architecture Decisions

- **Project structure**: Feature-based — `src/features/{auth,property,guests,bookings}/` each with own views, stores, composables; shared code in `src/shared/` (api client, layouts, common components)
- **CSS architecture**: `main.css` holds `:root` design tokens and reusable component/utility styles (search bar, form section, status chips, panel, `.form-error`, `.invite-info`, etc.); [docs/design.html](docs/design.html) uses main.css and only adds doc-only layout (swatches, section headings). Component/view styles are `<style scoped>` and must use main.css (and Pico) tokens for colors, typography, spacing, borders, shadows—avoid custom hex/rgba/rem when a token exists.
- **Token storage**: localStorage for both access and refresh tokens; migrate refresh to httpOnly cookie when backend refresh endpoint is added
- **API client**: Axios with interceptors (auto-attach JWT, 401 redirect, error handling)
- **Feature API modules**: Each feature has its own `api.js` (e.g., `src/features/auth/api.js`) encapsulating HTTP calls and response parsing — stores stay thin and call these modules
- **API integration**: When implementing API integration, propose backend changes explicitly when they would help the frontend: (1) **Response shape** — if a different response model (e.g. structure, fields, pagination) would make the frontend simpler, faster, or avoid extra requests, state the proposed change and what the backend should return; (2) **Missing endpoints** — if the feature needs an endpoint/parameter that does not exist, propose it explicitly (method, path, request/response shape) and explain why it is required. Do not work around suboptimal or missing APIs in silence. **All proposed backend changes must be listed in [docs/backend-change-requests.md](docs/backend-change-requests.md)** (endpoint, params, reason, frontend usage).

## UI/UX Design Decisions

- **Design implementation**: Use `/frontend-design` and `/interface-design` skills when working on UI/UX design and implementation
- **Design system**: All colors, typography, spacing, and depth live in [src/assets/main.css](src/assets/main.css) as CSS custom properties. Reference page: [docs/design.html](docs/design.html). Use tokens from main.css in new components; do not introduce hardcoded hex or ad-hoc values.
- **Navigation**: Collapsible **dark** sidebar — Bookings (home/grid), Guests, Settings. Sidebar uses `--sidebar-bg`, `--sidebar-text`, `--sidebar-user-menu-bg` etc. in [main.css](src/assets/main.css); see [docs/design.md](docs/design.md) and design.html.
- **Interaction pattern (universal)**: List/Grid -> Side panel (summary + quick actions) -> Full page (detail + edit). Consistent for bookings and guests.
- **Visual style**: Cool gray-blue base (`--canvas`), teal accent (`--brand-primary`) on Pico CSS; corporate but joyful; generous whitespace. Typography: DM Sans (`--font-body`) + Plus Jakarta Sans (`--font-display`) for headings. Main content area: spacing (--content-area-gap), rounded panel (--content-area-radius). See design system tokens and [docs/design.html](docs/design.html) for full reference.
- **Booking status colors**: `--status-confirmed`, `--status-checked-in`, `--status-checked-out`, `--status-canceled` (see main.css and design reference)
- **Grid style**: Cloudbeds/Mews Gantt timeline, flexible date range (7/14/30 days, remembered)

## Conventions

- **Feature planning and implementation**: Before implementing a feature or during feature planning, always refer to [docs/design.md](docs/design.md), [docs/design.html](docs/design.html), and [docs/requirements.md](docs/requirements.md) so implementation aligns with design system and requirements.
- **Backend change requests**: Document all proposed API changes (new endpoints, new query params, response shape changes) in [docs/backend-change-requests.md](docs/backend-change-requests.md).
- **Shared components**: If a component is reused in multiple places and can be moved to a shared component, extract it to `src/shared/` (or the appropriate shared location) and reuse it instead of duplicating. When extracting, keep the component style-light: use existing main.css classes and tokens only; remove the same styles from the feature views that previously owned them so main.css remains the single source of truth.
- `docs/` directory contains design and requirements reference — excluded from builds
- Don't create `.md` files unless explicitly requested
- Don't bypass errors with workarounds — fix root causes
- **API errors**: Backend returns `{ "error": "human-readable message" }`. Use `data?.error` (not `data?.message`) in the API client and in feature views when surfacing API error messages.
- **Design doc sync**: When changing UI or design decisions (e.g. sidebar theme, new tokens), update both [docs/design.md](docs/design.md) (decisions + palette list) and [docs/design.html](docs/design.html) (visual reference + swatches) so the design system stays the single source of truth.

## Design system learnings

- **Intent block** in [src/assets/main.css](src/assets/main.css): who (reception, staff), what (manage bookings/guests), feel (warm, calm, teal accent). When adding or changing tokens, keep intent consistent.
- **Content and forms**: Content sections use full horizontal space (no arbitrary max-width). Form inputs stack vertically; form labels use body font size (`label` rule in main.css). Apply these in new views.
- **When reviewing UI** (e.g. with /interface-design): Ensure fallbacks in components match current token values; avoid template-style constraints (e.g. max-width on cards) that contradict full-width content; run token test (names should evoke the product).

## Frontend / Vue learnings

- **Pinia state in views**: Use `storeToRefs(store)` when destructuring store state in components so the view stays reactive to async store updates (e.g. direct navigation vs. coming from another page that already loaded data).
- **Sidebar active link**: Use CSS class `router-link-exact-active` (not `router-link-active`) for nav link styling when the root path is `/` and all app routes are its children—otherwise the home/dashboard link stays active on every page.
- **Pico margin overrides**: In [main.css](src/assets/main.css) we override Pico’s default bottom margins (buttons, block elements, `details`, form elements `input`/`select`/`textarea`) so the app controls spacing; add new Pico overrides there rather than in components.
- **Pico focus ring**: Pico sets `--pico-outline-width: 0.0625rem` on text inputs; root is `0.125rem`. For custom input-like components (e.g. search bar) use `0.0625rem` in the focus box-shadow so the ring matches standard inputs.
- **Feature vs view naming**: A feature (e.g. `property`) can have multiple views. Name the view after the screen: `RoomsView` for the Rooms screen, not `PropertyView`; reserve `PropertyView` or similar for a future “Hotel settings” or property-level screen. Route path can stay feature-level (`/property`).
- **404 inside layout**: Use a catch-all child route under the main layout (`path: '/:pathMatch(.*)*'`) so unknown routes still render AppLayout with a NotFound view in the content area.
- **Accordions (multiple open)**: Use native `<details>` without a controlled `:open` binding so each accordion opens and closes independently.
- **List-with-search parity**: When adding a new list view that has search, follow the same pattern as the reference feature (e.g. Guests): server-side search with `q`, debounced input, `initialLoading` vs `searching`, spinner in the search bar (no full-page loader). Document any needed API changes in [docs/backend-change-requests.md](docs/backend-change-requests.md). Do not implement client-side filtering when the project standard is server-side search.
- **List view layout**: On list-with-search pages, show the **search bar always** (directly under the page header). Then show error message, loading state, or content below. Do not hide the search bar when there is a load error or empty state—users can retry or refine search.
- **Bookings vs Dashboard**: The **reservation grid** (timeline/Gantt) lives on the **Dashboard** (home). The **Bookings** nav points to a **list view** (like Guests): searchable list, row click → side panel, “Open Full Page” → detail. Use `GET /api/bookings` for the list (with `q` for search); `GET /api/bookings/grid` is for the Dashboard grid.
- **Booking form / GuestPicker**: Full booking create form and guest picker are **P5** (JSONForm renderer). Until then, use placeholder views (e.g. “Form will be available in P5 with JSONForm renderer”) like GuestNewView; do not implement a hardcoded booking form or GuestPicker in earlier phases.
- **Booking list search**: Booking list search is by **guest** (name, email, phone) or **room** (room number, room type name). Document in backend-change-requests that `GET /api/bookings?q=...` filters by both; placeholder text in the search bar should reflect “guest or room”.
