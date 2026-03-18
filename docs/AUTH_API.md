# Auth API Contract (`oauth-service`)

This document describes the current authentication API exposed by `oauth-service`.

Base URL examples:
- Local: `http://localhost:3001`
- Cloud Run: `https://<oauth-service-url>`

## Response Envelope

Success response:

```json
{
  "success": true,
  "data": {},
  "message": "optional"
}
```

Error response:

```json
{
  "success": false,
  "error": "error message",
  "message": "optional"
}
```

Exception:
- `GET /health/ready` on failure (`503`) returns `{ success: false, data: ... }` without an `error` field.

## Auth Model

- Auth token is a JWT signed by `JWT_SECRET`.
- JWT expiration: `7d`.
- JWT transport:
  - `Authorization: Bearer <token>`
  - `token` cookie (httpOnly, `SameSite=Lax`, max-age `1 day`)
- Middleware checks Bearer first, then cookie.

JWT payload shape:

```json
{
  "userId": "uuid",
  "role": "user|admin",
  "email": "optional",
  "githubUsername": "optional"
}
```

## CORS

Current service CORS config:
- `origin`: `http://localhost:3000`
- `credentials`: `true`

Frontend must send credentials when using cookie auth.

## Endpoints

### `GET /health`

Public health endpoint.

Example success (`200`):

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-03-18T00:00:00.000Z",
    "service": "oauth-service"
  }
}
```

### `GET /health/ready`

Readiness endpoint with DB check.

Example success (`200`):

```json
{
  "success": true,
  "data": {
    "status": "ready",
    "database": "connected",
    "timestamp": "2026-03-18T00:00:00.000Z"
  }
}
```

Example failure (`503`):

```json
{
  "success": false,
  "data": {
    "status": "unready",
    "database": "disconnected",
    "timestamp": "2026-03-18T00:00:00.000Z"
  }
}
```

### `POST /auth/register`

Register a local user (email/password) and issue JWT.

Request body:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "name": "Optional Name"
}
```

Rules:
- `email`: valid email
- `password`: min `8`, max `128`
- `name`: optional, min `1`, max `255`

Success (`201`):

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Optional Name",
      "role": "user"
    }
  }
}
```

Also sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax`.

Errors:
- `400`: invalid payload
- `409`: email already registered
- `500`: server/db error

### `POST /auth/login`

Login with email/password and issue JWT.

Request body:

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

Rules:
- `email`: valid email
- `password`: min `1`, max `128`

Success (`200`):

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Optional Name",
      "role": "user",
      "githubUsername": null
    }
  }
}
```

Also sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax`.

Errors:
- `400`: invalid payload
- `401`: invalid email or password
- `500`: server/db error

### `GET /auth/github`

Starts GitHub OAuth flow.

Behavior:
- Generates `oauth_state`
- Sets `oauth_state` cookie (httpOnly, 15 min)
- Redirects (`302`) to GitHub authorize URL

### `GET /auth/callback/github`

GitHub OAuth callback endpoint.

Query params:
- `code` (required)
- `state` (required and must match `oauth_state` cookie)

Success (`200`):

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "uuid",
      "githubUsername": "octocat"
    }
  }
}
```

Also sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax`.

Errors:
- `400`: missing `code`
- `403`: invalid state
- `500`: GitHub/db/internal error

### `GET /auth/me`

Returns current authenticated user profile.

Auth required:
- Bearer token or `token` cookie.

Success (`200`):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Optional Name",
    "avatarUrl": null,
    "githubUsername": null,
    "role": "user",
    "lastLoginAt": "2026-03-18T00:00:00.000Z",
    "createdAt": "2026-03-18T00:00:00.000Z"
  }
}
```

Errors:
- `401`: missing/invalid/expired token
- `404`: user not found
- `500`: internal error

### `POST /auth/logout`

Clears auth cookie (`token`).

Success (`200`):

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

Notes:
- JWT is stateless. Clearing cookie logs out browser-cookie flow.
- A previously copied Bearer token remains valid until token expiry.

## Frontend Integration Notes

- Preferred browser approach: cookie-based auth (`credentials: "include"`).
- Alternative approach: store token and send `Authorization: Bearer <token>`.
- Current callback is `/auth/callback/github` (not `/auth/github/callback`).
