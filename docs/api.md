# API Phase 2

Base URL:

```text
http://localhost:3001/api/v1
```

Swagger:

```text
http://localhost:3001/api/docs
```

## Health va Auth

```http
GET /health
POST /auth/login
GET /auth/me
POST /auth/logout
PATCH /auth/change-password
GET /auth/permission-check
```

Dang nhap tai khoan seed development:

```json
{
  "identifier": "admin",
  "password": "Admin@123456"
}
```

Tat ca API nghiep vu ben duoi can header:

```http
Authorization: Bearer <accessToken>
```

## Customers

```http
GET /customers?page=1&limit=10&search=&isActive=true
POST /customers
GET /customers/:id
PATCH /customers/:id
PATCH /customers/:id/deactivate
```

Payload tao khach hang:

```json
{
  "customerCode": "CUS-001",
  "customerName": "Cong ty May Demo",
  "contactPerson": "Nguyen Van A",
  "phone": "0900000000",
  "email": "demo@example.com",
  "address": "TP HCM",
  "taxCode": "0312345678",
  "note": "Khach hang mau"
}
```

## Products

```http
GET /products?page=1&limit=10&search=&category=&isActive=true
POST /products
GET /products/:id
PATCH /products/:id
PATCH /products/:id/deactivate
```

Payload tao san pham:

```json
{
  "productCode": "PRO-001",
  "productName": "Ao thun basic",
  "category": "Ao thun",
  "unit": "cai",
  "standardSewingMinutes": 18,
  "description": "San pham demo"
}
```

## Orders

```http
GET /orders/summary
GET /orders?page=1&limit=10&search=&status=&priority=&customerId=
POST /orders
GET /orders/:id
PATCH /orders/:id
PATCH /orders/:id/status
GET /orders/:id/status-history
```

Payload tao don hang:

```json
{
  "orderCode": "ORD-001",
  "customerId": 1,
  "orderDate": "2026-06-16",
  "expectedDeliveryDate": "2026-06-30",
  "priority": "NORMAL",
  "note": "Don hang demo",
  "items": [
    {
      "productId": 1,
      "quantity": 120,
      "unitPrice": 65000,
      "note": "Mau den"
    }
  ]
}
```

Trang thai don hang:

```text
DRAFT -> CONFIRMED -> PLANNED -> IN_PRODUCTION -> QUALITY_CHECK -> COMPLETED -> DELIVERED
```

Co the huy don hang tu nhieu trang thai bang `CANCELLED`, nhung bat buoc co `changeNote`.

```json
{
  "status": "CONFIRMED",
  "changeNote": "Da xac nhan voi khach"
}
```

## AI

```http
GET /ai/health
```

Endpoint nay proxy den FastAPI `GET /health` qua `AI_SERVICE_URL`.
