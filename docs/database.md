# Database Phase 2

Backend su dung MySQL thong qua `mysql2/promise`.

Thu muc database:

```text
apps/backend/database/
  migrations/
  seed.js
```

Bang nen tang:

- `roles`
- `permissions`
- `role_permissions`
- `users`
- `system_settings`
- `schema_migrations`

Bang nghiep vu Phase 2:

- `customers`
- `products`
- `orders`
- `order_items`
- `order_status_histories`

Migration:

- `001_initial_auth_schema.sql`: auth, role, permission, setting.
- `002_phase2_business_schema.sql`: khach hang, san pham, don hang, chi tiet don hang va lich su trang thai.

Seed:

- Tai khoan admin development.
- Permission Phase 2 cho customer/product/order.
- Du lieu demo: `CUS-DEMO-001`, `PRO-DEMO-001`, `PRO-DEMO-002`, `ORD-DEMO-001`.

Lenh:

```bash
npm --workspace apps/backend run db:migrate
npm --workspace apps/backend run db:seed
```
