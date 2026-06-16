# He thong quan ly va dieu hanh san xuat xuong may tich hop AI

Monorepo cho do an quan ly san xuat xuong may. Phase 2 hien tai tap trung vao auth/RBAC va cac module nghiep vu dau tien:

- Frontend: ReactJS, Vite, Material UI, React Router, Axios, Recharts.
- Backend: JavaScript ES Module, Node.js, Express.js, mysql2/promise, MySQL, Swagger, Socket.IO.
- AI Service: Python, FastAPI, Pydantic, Pandas, NumPy, Scikit-learn, OR-Tools.
- DevOps: Docker Compose, Nginx, `.env.example`.

## Cau truc

```text
apps/
  frontend/
  backend/
  ai-service/
docker/
docs/
docker-compose.yml
.env.example
```

## Chay voi Docker

```bash
cp .env.example .env
docker compose up --build
```

Cong mac dinh:

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/api/v1/health
- Swagger: http://localhost:3001/api/docs
- AI health: http://localhost:8000/health
- Nginx: http://localhost:8080

## Chay khong dung Docker

```bash
npm install
cp .env.example .env
npm --workspace apps/backend run db:migrate
npm --workspace apps/backend run db:seed
npm run dev:backend
npm run dev:frontend
```

Neu chay backend rieng bang `npm --workspace apps/backend start`, hay tao file `.env` o root hoac `apps/backend/.env` va dien dung tai khoan MySQL:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mat_khau_mysql_cua_ban
DB_NAME=garment_production
```

AI service:

```bash
cd apps/ai-service
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Test API bang Postman

Import file:

```text
docs/postman/garment-production-phase-1.postman_collection.json
docs/postman/garment-production-phase-2.postman_collection.json
```

Collection Phase 2 co login, customers, products, orders, cap nhat trang thai va status history.

## Tai khoan development mau

Sau khi chay seed:

```text
Username: admin
Email: admin@example.com
Password: xem DEV_ADMIN_PASSWORD trong .env development
```

Mat khau duoc bam bang bcrypt truoc khi luu vao MySQL.

## Trang thai Phase 2

Da co dang nhap JWT, RBAC, migration MySQL, seed admin development, customers, products va orders. Cac module kho, BOM, QC, thiet bi, ke hoach san xuat va AI nghiep vu hoan chinh de danh cho phase sau.
