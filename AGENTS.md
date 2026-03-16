## Tech Stack

- **Frontend**: Vue 3 + Vite + Pinia + Vue Router + Pico CSS
- **Backend**: Go modular monolith, REST JSON API, JWT auth (HS256)

## Architecture Decisions

- **Project structure**: Feature-based — `src/features/{auth,property,guests,bookings}/` each with own views, stores, composables; shared code in `src/shared/` (api client, layouts, common components)
- **CSS architecture**: `main.css` holds only `:root` design tokens (CSS variables); component styles are `<style scoped>`; shared layout wrappers use `:slotted()` to style slot content
- **Token storage**: localStorage for both access and refresh tokens; migrate refresh to httpOnly cookie when backend refresh endpoint is added
- **API client**: Axios with interceptors (auto-attach JWT, 401 redirect, error handling)
- **Feature API modules**: Each feature has its own `api.js` (e.g., `src/features/auth/api.js`) encapsulating HTTP calls and response parsing — stores stay thin and call these modules

## UI/UX Design Decisions

- **Design implementation**: Use `/frontend-design` and `/interface-design` skills when working on UI/UX design and implementation
- **Design system**: All colors, typography, spacing, and depth live in [src/assets/main.css](src/assets/main.css) as CSS custom properties. Reference page: [docs/design.html](docs/design.html). Use tokens from main.css in new components; do not introduce hardcoded hex or ad-hoc values.
- **Navigation**: Collapsible **dark** sidebar — Bookings (home/grid), Guests, Settings. Sidebar uses `--sidebar-bg`, `--sidebar-text`, `--sidebar-user-menu-bg` etc. in [main.css](src/assets/main.css); see [docs/design.md](docs/design.md) and design.html.
- **Interaction pattern (universal)**: List/Grid -> Side panel (summary + quick actions) -> Full page (detail + edit). Consistent for bookings and guests.
- **Visual style**: Cool gray-blue base (`--canvas`), teal accent (`--brand-primary`) on Pico CSS; corporate but joyful; generous whitespace. Typography: DM Sans (`--font-body`) + Plus Jakarta Sans (`--font-display`) for headings. Main content area: spacing (--content-area-gap), rounded panel (--content-area-radius). See design system tokens and [docs/design.html](docs/design.html) for full reference.
- **Booking status colors**: `--status-confirmed`, `--status-checked-in`, `--status-checked-out`, `--status-canceled` (see main.css and design reference)
- **Grid style**: Cloudbeds/Mews Gantt timeline, flexible date range (7/14/30 days, remembered)

## Conventions

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
- **Pico margin overrides**: In [main.css](src/assets/main.css) we override Pico’s default bottom margins (buttons, block elements, `details`) so the app controls spacing; add new Pico overrides there rather than in components.
- **404 inside layout**: Use a catch-all child route under the main layout (`path: '/:pathMatch(.*)*'`) so unknown routes still render AppLayout with a NotFound view in the content area.
- **Accordions (multiple open)**: Use native `<details>` without a controlled `:open` binding so each accordion opens and closes independently.
