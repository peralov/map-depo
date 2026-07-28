# Configuration

Open Waste Map uses separate environment files for the API and web
application. Copy the committed examples before local development:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Real environment files are ignored by Git. Never commit access tokens,
database credentials, or JWT secrets.

## Backend

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Express listening port |
| `JWT_SECRET` | Development-only fallback | Signs authentication tokens; required in production |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime accepted by `jsonwebtoken` |
| `SQLITE_DB_PATH` | `backend/data/map-depo.sqlite` | SQLite file path; use `:memory:` for tests |
| `SEED_DATABASE` | `true` | Creates development users and global demo sites |
| `CORS_ORIGIN` | `*` | Allowed web origin or comma-separated origins |
| `NODE_ENV` | unset | Set to `production` to require an explicit JWT secret |

Production example:

```dotenv
PORT=3000
NODE_ENV=production
JWT_SECRET=use-a-long-random-value
JWT_EXPIRES_IN=12h
SQLITE_DB_PATH=/var/lib/open-waste-map/data.sqlite
SEED_DATABASE=false
CORS_ORIGIN=https://map.example.org,https://www.example.org
```

Relative SQLite paths are resolved from the process working directory. Use an
absolute path in production so deployment changes do not create an unexpected
database.

## Frontend

Only variables prefixed with `VITE_` are included in the frontend build.
Values in a compiled frontend are public, including the Mapbox public token.
Restrict that token to the deployment's allowed URLs in Mapbox.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_APP_NAME` | `Open Waste Map` | Header, footer, and product name |
| `VITE_APP_TAGLINE` | `Map waste. Verify reports. Organize action.` | Footer/product copy |
| `VITE_API_URL` | `http://localhost:3000/api` | Absolute API base URL |
| `VITE_MAPBOX_TOKEN` | none | Required public Mapbox access token |
| `VITE_MAP_STYLE` | Mapbox satellite streets | Mapbox style URL |
| `VITE_MAP_CENTER` | `0,20` | Initial `longitude,latitude` |
| `VITE_MAP_ZOOM` | `1.6` | Initial zoom from 0 to 22 |
| `VITE_MAP_AUTO_FIT` | `true` | Frames all loaded site coordinates after load |

Invalid centers or zooms fall back to the world view. Coordinates follow
Mapbox order: longitude first, latitude second.

## Global and regional installations

The same codebase supports both models:

- **Global installation:** keep the default world center and auto-fit enabled.
- **Regional installation:** set a center and zoom, then disable auto-fit if
  reports outside the intended region should not change the opening viewport.
- **White-label installation:** set the app name, tagline, style, and CORS
  origin without editing source code.

Example for a regional deployment:

```dotenv
VITE_APP_NAME=Community Cleanup Map
VITE_APP_TAGLINE=Local reports, shared responsibility.
VITE_MAP_CENTER=-3.7038,40.4168
VITE_MAP_ZOOM=9
VITE_MAP_AUTO_FIT=false
```

This controls presentation only. The API intentionally accepts every valid
global coordinate. If an operator needs a strict service area, implement an
explicit server-side geographic policy rather than relying on the map
viewport.

## Production checklist

- Set `NODE_ENV=production` and a strong `JWT_SECRET`.
- Set `SEED_DATABASE=false`.
- Restrict `CORS_ORIGIN` to trusted web origins.
- Restrict the Mapbox token by URL and use the minimum scopes.
- Put the API behind HTTPS and a reverse proxy.
- Back up the SQLite file or migrate to a managed relational database.
- Add rate limiting and request-size limits at the proxy or API.
- Run the backend test and frontend production build before release.
