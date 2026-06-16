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

Bang nghiep vu Phase 3:

- `suppliers` (Nha cung cap)
- `materials` (Nguyen phu lieu)
- `warehouses` (Kho hang)
- `boms` (Dinh muc ky thuat vat tu)
- `bom_items` (Vat tu chi tiet trong BOM)
- `inventory_balances` (So du ton kho thuc te theo vat tu & kho)
- `inventory_transactions` (Lich su phieu kho: Nhap, Xuat, Dieu chinh)
- `inventory_transaction_items` (Vat tu chi tiet trong phieu kho)

Migration:

- `001_initial_auth_schema.sql`: auth, role, permission, setting.
- `002_phase2_business_schema.sql`: khach hang, san pham, don hang, chi tiet don hang va lich su trang thai.
- `003_phase3_inventory_bom_schema.sql`: schema cho nha cung cap, nguyen phu lieu, kho hang, BOM, ton kho va giao dich kho.

Seed:

- Tai khoan admin development.
- Permission Phase 2 cho customer/product/order.
- Permission Phase 3 cho suppliers, materials, warehouses, BOM, inventory va material requirements.
- Du lieu demo:
  - 3 suppliers (`SUP-DEMO-001` - `003`)
  - 10 materials (`MAT-FAB-...`, `MAT-THR-...`, `MAT-BUT-...`)
  - 2 warehouses (`WH-DEMO-MAIN` va `WH-DEMO-SEC`)
  - BOM active cho cac san pham demo
  - Phieu nhap kho ban dau de tao so du ton kho demo.

Lenh:

```bash
npm --workspace apps/backend run db:migrate
npm --workspace apps/backend run db:seed
```
