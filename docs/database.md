# Database Phase 1

Backend su dung MySQL thong qua `mysql2/promise`.

Thu muc database:

```text
apps/backend/database/
  migrations/
  seeds/
  README.md
```

Bang nen tang:

- `roles`
- `permissions`
- `role_permissions`
- `users`
- `system_settings`
- `schema_migrations`

Lenh:

```bash
npm --workspace apps/backend run db:migrate
npm --workspace apps/backend run db:seed
```
