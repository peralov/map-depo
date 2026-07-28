# Contributing

## Local setup

1. Install Node.js 20 or later and Yarn 1.x.
2. Install dependencies in `backend/` and `frontend/`.
3. Copy both committed environment examples.
4. Set a local JWT secret and public Mapbox token.
5. Start the API and web application in separate terminals.

Full commands are in the [README](README.md#getting-started).

## Development guidelines

- Keep public terminology region-neutral and prefer **waste site** or **site**.
- Use canonical `/api/sites` routes for new frontend code.
- Preserve legacy API aliases unless a deliberate breaking release removes
  them.
- Keep route-level Vue views focused on composition.
- Use props down and events up for component communication.
- Derive UI state with computed values; use watchers only for side effects.
- Store Mapbox and other third-party class instances in shallow references.
- Put reusable pure functions in `frontend/src/utils/`.
- Keep secrets out of source control and update `.env.example` when adding a
  variable.
- Use parameterized SQL and validate all externally supplied values.

## Before submitting a change

Run:

```sh
cd backend
yarn test

cd ../frontend
yarn test
yarn build
```

For UI changes, also verify:

- The world and configured regional viewports load.
- A site can be created at valid zero coordinates.
- Marker colors change for status, type, and size.
- Public pages work while signed out.
- Protected routes redirect to login and return to the requested page.
- Keyboard focus, labels, error messages, and mobile side panels remain usable.

## Documentation

Update the relevant document when behavior changes:

- `README.md` for onboarding and product capabilities.
- `docs/CONFIGURATION.md` for environment variables.
- `docs/API.md` for routes and JSON contracts.
- `docs/ARCHITECTURE.md` for boundaries and data flow.
- `docs/ROADMAP.md` when a limitation is resolved or reprioritized.
