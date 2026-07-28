# REST API

## Conventions

Local base URL:

```text
http://localhost:3000/api
```

Requests and responses use JSON. Protected routes require:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Errors use:

```json
{
  "error": "Human-readable message"
}
```

The API does not currently paginate collection responses.

## Health

### `GET /health`

Returns process health without accessing protected data.

```json
{
  "status": "ok",
  "service": "open-waste-map-api"
}
```

## Authentication

### `POST /register`

Body:

```json
{
  "username": "alice",
  "email": "alice@example.org",
  "password": "a-strong-password"
}
```

### `POST /login`

Body:

```json
{
  "username": "alice",
  "password": "a-strong-password"
}
```

Both endpoints return:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.org",
    "role": "public"
  }
}
```

## Sites

### `GET /sites`

Returns all sites.

### `GET /sites/:id`

Returns one site or `404`.

Site response:

```json
{
  "id": 7,
  "name": "Riverside plastic accumulation",
  "description": "Plastic waste visible beside the footpath.",
  "latitude": -1.2864,
  "longitude": 36.8172,
  "status": "medium",
  "type": "plastic",
  "size": "small",
  "reportedBy": {
    "id": 1,
    "username": "alice"
  },
  "vouchCount": 2,
  "createdAt": "2026-07-29 10:00:00"
}
```

### `POST /sites`

Authentication required.

```json
{
  "name": "Riverside plastic accumulation",
  "description": "Plastic waste visible beside the footpath.",
  "latitude": -1.2864,
  "longitude": 36.8172,
  "status": "medium",
  "type": "plastic",
  "size": "small"
}
```

`name`, `latitude`, and `longitude` are required. Coordinates must be finite;
latitude must be between `-90` and `90`, longitude between `-180` and `180`.

### `PUT /sites/:id`

Authentication and site ownership required. Accepted fields:

```json
{
  "name": "Updated name",
  "description": "Updated description",
  "status": "low",
  "type": "plastic",
  "size": "medium"
}
```

Coordinates are not editable through this endpoint.

## Comments

### `GET /sites/:id/comments`

Public. Returns newest comments first.

### `POST /sites/:id/comments`

Authentication required.

```json
{
  "content": "The access road is beside the bridge."
}
```

### `DELETE /comments/:id`

Authentication and comment authorship required.

## Reports

Reports describe a change or issue at an existing site.

### `GET /sites/:id/reports`

Public.

### `POST /sites/:id/reports`

Authentication required.

```json
{
  "details": "The waste has spread toward the water."
}
```

### `GET /reports/user`

Authentication required. Returns reports created by the current user.

### `DELETE /reports/:id`

Authentication required. The reporter or an administrator can delete.

### `GET /reports`

Administrator only. Returns all reports.

### `PUT /reports/:id/status`

Administrator only.

```json
{
  "status": "resolved"
}
```

Allowed values: `pending`, `resolved`, `rejected`.

## Vouches

### `GET /sites/:id/vouches`

Public. Returns users who confirmed the site.

### `POST /sites/:id/vouches`

Authentication required. An account can vouch once for a site.

### `DELETE /sites/:id/vouches`

Authentication required. Removes the current user's vouch.

## Cleanups

### `GET /cleanups`

Returns all cleanup events ordered by date.

### `GET /cleanups/upcoming`

Returns up to ten future scheduled cleanups.

### `GET /cleanups/:id`

Returns one cleanup with its site and participant list.

### `GET /sites/:id/cleanups`

Returns cleanup events for a site.

### `POST /sites/:id/cleanups`

Authentication required. The organizer is automatically added as the first
participant.

```json
{
  "date": "2026-09-12",
  "details": "Bring gloves, water, and reusable collection bags."
}
```

### `PUT /cleanups/:id`

Authentication and organizer ownership required. Accepted fields:

```json
{
  "date": "2026-09-19",
  "details": "New meeting point at the east entrance.",
  "status": "scheduled"
}
```

Allowed statuses: `scheduled`, `completed`, `cancelled`.

### `POST /cleanups/:id/join`

Authentication required. Adds the current user to a scheduled cleanup.

### `DELETE /cleanups/:id/join`

Authentication required. Removes the current user. The organizer cannot leave
their own cleanup.

## Legacy compatibility

New integrations should use `/sites`. These original routes remain supported:

| Legacy | Canonical |
| --- | --- |
| `GET/POST /depos` | `GET/POST /sites` |
| `GET/PUT /depos/:id` | `GET/PUT /sites/:id` |
| `GET/POST /depos/:id/comments` | `GET/POST /sites/:id/comments` |
| `GET/POST /depos/:id/reports` | `GET/POST /sites/:id/reports` |
| `GET /depos/:id/vouches` | `GET /sites/:id/vouches` |
| `POST/DELETE /depos/:id/vouch` | `POST/DELETE /sites/:id/vouches` |
| `GET /depos/:id/cleanups` | `GET /sites/:id/cleanups` |
| `POST /depos/:id/cleanup` | `POST /sites/:id/cleanups` |
