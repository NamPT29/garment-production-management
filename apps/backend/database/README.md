# Backend Database

Thu muc nay chua migration va seed SQL/JavaScript cho MySQL.

## Lenh chay

```bash
npm --workspace apps/backend run db:migrate
npm --workspace apps/backend run db:seed
```

Migration su dung `mysql2/promise`, bang `schema_migrations` ghi lai file da chay.

Seed tao 9 vai tro, danh sach permission nen tang va tai khoan ADMIN development. Mat khau admin duoc doc tu bien moi truong `DEV_ADMIN_PASSWORD` va duoc bam bang bcrypt truoc khi luu vao database.
