## Tech Stack

- **Frontend**: Vue 3 + Vite + Pinia + Vue Router + Pico CSS
- **Backend**: Go modular monolith, REST JSON API, JWT auth (HS256)

## Architecture Decisions

- **Project structure**: Feature-based — `src/features/{auth,property,guests,bookings}/` each with own views, stores, composables; shared code in `src/shared/` (api client, layouts, common components)
- **API client**: Axios with interceptors (auto-attach JWT, 401 redirect, error handling)
- **Token storage**: localStorage for both access and refresh tokens; migrate refresh to httpOnly cookie when backend refresh endpoint is added

## UI/UX Design Decisions

- **Navigation**: Collapsible sidebar -- Bookings (home/grid), Guests, Settings
- **Interaction pattern (universal)**: List/Grid -> Side panel (summary + quick actions) -> Full page (detail + edit). Consistent for bookings and guests.
- **Visual style**: Warm cream/off-white base + teal accent on Pico CSS; corporate but joyful; generous whitespace
- **Booking status colors**: confirmed=teal, checked_in=green, checked_out=gray, canceled=soft red
- **Grid style**: Cloudbeds/Mews Gantt timeline, flexible date range (7/14/30 days, remembered)

## Conventions

- `docs/` directory contains design and requirements reference — excluded from builds
- Don't create `.md` files unless explicitly requested
- Don't bypass errors with workarounds — fix root causes