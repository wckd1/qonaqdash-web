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
- **Navigation**: Collapsible sidebar -- Bookings (home/grid), Guests, Settings
- **Interaction pattern (universal)**: List/Grid -> Side panel (summary + quick actions) -> Full page (detail + edit). Consistent for bookings and guests.
- **Visual style**: Cool gray-blue base (`#f5f7fa`) + teal accent on Pico CSS; corporate but joyful; generous whitespace
- **Typography**: DM Sans (body) + DM Serif Display (headings/brand), loaded via Google Fonts in `index.html`
- **Booking status colors**: confirmed=teal, checked_in=green, checked_out=gray, canceled=soft red
- **Grid style**: Cloudbeds/Mews Gantt timeline, flexible date range (7/14/30 days, remembered)

## Conventions

- `docs/` directory contains design and requirements reference — excluded from builds
- Don't create `.md` files unless explicitly requested
- Don't bypass errors with workarounds — fix root causes
