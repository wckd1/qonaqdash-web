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
- **Navigation**: Collapsible sidebar -- Bookings (home/grid), Guests, Settings
- **Interaction pattern (universal)**: List/Grid -> Side panel (summary + quick actions) -> Full page (detail + edit). Consistent for bookings and guests.
- **Visual style**: Cool gray-blue base (`--canvas`), teal accent (`--brand-primary`) on Pico CSS; corporate but joyful; generous whitespace. Typography: DM Sans (`--font-body`) + Plus Jakarta Sans (`--font-display`) for headings. Main content area: spacing (--content-area-gap), rounded panel (--content-area-radius). See design system tokens and [docs/design.html](docs/design.html) for full reference.
- **Booking status colors**: `--status-confirmed`, `--status-checked-in`, `--status-checked-out`, `--status-canceled` (see main.css and design reference)
- **Grid style**: Cloudbeds/Mews Gantt timeline, flexible date range (7/14/30 days, remembered)

## Conventions

- `docs/` directory contains design and requirements reference — excluded from builds
- Don't create `.md` files unless explicitly requested
- Don't bypass errors with workarounds — fix root causes

## Design system learnings

- **Intent block** in [src/assets/main.css](src/assets/main.css): who (reception, staff), what (manage bookings/guests), feel (warm, calm, teal accent). When adding or changing tokens, keep intent consistent.
- **Content and forms**: Content sections use full horizontal space (no arbitrary max-width). Form inputs stack vertically; form labels use body font size (`label` rule in main.css). Apply these in new views.
- **When reviewing UI** (e.g. with /interface-design): Ensure fallbacks in components match current token values; avoid template-style constraints (e.g. max-width on cards) that contradict full-width content; run token test (names should evoke the product).
