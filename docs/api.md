# API Phase 1

Base URL:

```text
http://localhost:3001/api/v1
```

Swagger:

```text
http://localhost:3001/api/docs
```

## Health

```http
GET /api/v1/health
```

Response mau:

```json
{
  "success": true,
  "data": {
    "service": "backend",
    "status": "ok",
    "database": "ok",
    "stack": "JavaScript ES Module + Express + mysql2/promise + MySQL",
    "timestamp": "2026-06-16T00:00:00.000Z"
  },
  "message": "Backend dang hoat dong"
}
```

## Auth

```http
POST /api/v1/auth/login
GET /api/v1/auth/me
POST /api/v1/auth/logout
PATCH /api/v1/auth/change-password
GET /api/v1/auth/permission-check
```

`permission-check` la route thu nghiem co bao ve JWT va permission `USER_CREATE`.

## AI

```http
GET /api/v1/ai/health
```

Endpoint nay proxy den FastAPI `GET /health` qua `AI_SERVICE_URL`.
