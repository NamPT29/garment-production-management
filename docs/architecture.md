# Kien truc Phase 2

## Frontend

ReactJS + Vite dung JS/JSX, Material UI, React Router DOM, Axios va Recharts.

Man hinh hien co:

- Dang nhap.
- Dashboard tong quan lay du lieu tu API `/orders/summary`.
- Quan ly khach hang.
- Quan ly san pham.
- Danh sach, tao, sua, xem chi tiet va cap nhat trang thai don hang.
- Trang 404.

## Backend

Stack da thong nhat:

```text
Backend: JavaScript ES Module + Node.js + Express.js
Database: MySQL + mysql2/promise
Authentication: JWT + bcrypt
Validation: Zod
Authorization: Express RBAC Middleware
Testing: Jest + Supertest
AI Integration: Axios goi Python/FastAPI
```

Kien truc backend:

```text
Route -> Middleware -> Controller -> Service -> Repository -> mysql2/promise -> MySQL
```

Module hien co:

- `auth`
- `health`
- `ai`
- `customers`
- `products`
- `orders`

Order service su dung transaction khi tao/sua don hang va khi cap nhat trang thai. Lich su trang thai duoc luu trong `order_status_histories`.

## AI Service

Python + FastAPI giu vai tro service rieng. Phase 2 chua trien khai AI nghiep vu hoan chinh; backend moi proxy health check toi `AI_SERVICE_URL`.
