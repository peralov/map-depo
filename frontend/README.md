# Open Waste Map frontend

Vue 3 and Vite client for Open Waste Map.

Start with the repository [README](../README.md) for installation and local
development. Frontend-specific environment variables are documented in
[docs/CONFIGURATION.md](../docs/CONFIGURATION.md#frontend).

Important source areas:

- `src/components/map/` — Mapbox lifecycle, controls, and legend
- `src/config/app.js` — environment-backed product and map settings
- `src/stores/` — authentication and site API state
- `src/utils/map.js` — GeoJSON, marker color, and bounds utilities
- `src/views/` — route-level feature composition

Use the canonical `/api/sites` endpoints for new work. The backend keeps
legacy `/api/depos` routes only for compatibility.
