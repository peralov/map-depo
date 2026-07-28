# Project Assessment and Roadmap

## Current assessment

Open Waste Map has a coherent prototype domain: mapped sites lead naturally to
community verification, discussion, issue reporting, and cleanup events. The
route-controller-model API is easy to follow, SQLite makes onboarding simple,
and the integration test exercises the most important backend workflow.

The project is now region-neutral:

- Product branding and map settings are environment-driven.
- The default viewport is global and can auto-fit loaded data.
- Coordinates at the equator and prime meridian are accepted correctly.
- Demo records are clearly labeled and distributed across world regions.
- `/sites` is the canonical public API term.
- Existing `/depos` endpoints and `/depo/:id` links remain compatible.
- Mapbox tokens are no longer hard-coded in source.

## Priority 1: public-deployment safety

- Add rate limiting to login, registration, comments, reports, and site
  creation.
- Introduce centralized request schemas and maximum lengths for every text
  field.
- Configure request-body size limits and structured production error logging.
- Add account abuse controls, moderation audit history, and a content/reporting
  policy.
- Replace demo credentials and rotate any secret that has ever been committed.

## Priority 2: global data scale

`GET /sites` currently loads every record. That works for a prototype but not
for a global dataset.

- Add bounding-box parameters such as
  `GET /sites?bbox=west,south,east,north`.
- Query only the active map viewport and debounce map movement requests.
- Add server-side pagination for dashboard and moderation lists.
- Add appropriate coordinate, date, status, and foreign-key indexes.
- Move to PostgreSQL with PostGIS when geographic queries and concurrent
  writers outgrow SQLite.

## Priority 3: complete existing workflows

- Add join/leave controls for cleanup participants in the frontend.
- Add an organizer interface for editing cleanup details and status.
- Add an administrator interface for report moderation.
- Replace report photo previews with validated object-storage uploads.
- Add site edit and lifecycle controls, including transparent history.
- Decide how duplicate nearby sites should be detected and merged.

## Priority 4: quality and operations

- Expand frontend unit tests beyond map utilities to stores and forms.
- Add browser tests for sign-in, site creation, marker selection, and cleanup
  scheduling.
- Run test/build checks in continuous integration.
- Add API request IDs, metrics, uptime checks, and database backup monitoring.
- Lazy-load noncritical routes and review the Mapbox bundle size.
- Add accessibility testing for keyboard map alternatives and form errors.

## Suggested delivery order

1. Validation, rate limiting, secret rotation, and production error handling.
2. Viewport-bounded site queries and frontend request lifecycle.
3. Cleanup participation and moderation interfaces.
4. Real image uploads with storage lifecycle rules.
5. PostgreSQL/PostGIS migration when traffic or dataset size justifies it.
6. Continuous delivery, monitoring, and documented recovery procedures.

Each step should retain the `/sites` contract and keep legacy aliases until
client usage confirms they can be retired safely.
