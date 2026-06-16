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

---

# API Phase 3 (Material & Inventory Management)

## Suppliers (Nha Cung Cap)

```http
GET /suppliers?page=1&limit=10&search=&isActive=true
POST /suppliers
GET /suppliers/:id
PATCH /suppliers/:id
PATCH /suppliers/:id/deactivate
```

Payload tao/cap nhat nha cung cap:

```json
{
  "supplierCode": "SUP-001",
  "supplierName": "Cong ty Det Kim Phong Phu",
  "contactPerson": "Nguyen Van B",
  "phone": "0987654321",
  "email": "contact@phongphu.com",
  "address": "Binh Thanh, TP HCM",
  "taxCode": "0398765432",
  "notes": "Nha cung cap vai thun va cotton"
}
```

## Materials (Nguyen Phu Lieu)

```http
GET /materials?page=1&limit=10&search=&category=&supplierId=&isActive=true&lowStock=false
POST /materials
GET /materials/:id
PATCH /materials/:id
PATCH /materials/:id/deactivate
```

Danh muc nguyen phu lieu (`category`): `FABRIC` (vai), `THREAD` (chi), `BUTTON` (cuc/nut), `ZIPPER` (khoa), `LABEL` (nhan mac), `PACKAGING` (bao bi), `ACCESSORY` (phu kien), `OTHER` (khac).

Payload tao nguyen phu lieu:

```json
{
  "materialCode": "MAT-VAI-001",
  "materialName": "Vai Thun Cotton 4 Chieu",
  "category": "FABRIC",
  "unit": "met",
  "color": "Trang",
  "specification": "Kho 1.6m, dinh luong 230gsm",
  "minimumStock": 200,
  "defaultSupplierId": 1,
  "notes": "Vai chinh cho dong san pham thun"
}
```

## Warehouses (Kho Hang)

```http
GET /warehouses
POST /warehouses
GET /warehouses/:id
PATCH /warehouses/:id
PATCH /warehouses/:id/deactivate
GET /warehouses/:id/balances?page=1&limit=10&search=&category=&lowStock=false
```

Payload tao kho hang:

```json
{
  "warehouseCode": "WH-MAIN",
  "warehouseName": "Kho Vat Tu Chinh",
  "location": "Khu vuc A1 - Tang trith",
  "description": "Kho chua vai va phu lieu chinh cua nha may"
}
```

## BOMs (Dinh Muc Vat Tu)

```http
GET /boms?page=1&limit=10&productId=&status=
POST /boms
GET /boms/:id
PATCH /boms/:id
PATCH /boms/:id/activate
PATCH /boms/:id/deactivate
```

- Bảng định mức khi mới tạo ở trạng thái `DRAFT` (Nháp) và có thể sửa đổi (`PATCH /boms/:id`).
- Khi kích hoạt bảng định mức (`PATCH /boms/:id/activate`): trạng thái chuyển thành `ACTIVE`, tất cả các phiên bản định mức hoạt động cũ của cùng sản phẩm sẽ tự động chuyển thành `INACTIVE` (atomically).
- BOM ở trạng thái `ACTIVE` không thể sửa đổi hay xoá trực tiếp.

Payload tạo BOM:

```json
{
  "productId": 1,
  "version": "V1.0",
  "effectiveDate": "2026-06-16",
  "notes": "Dinh muc vai va phu lieu cho ao thun basic",
  "items": [
    {
      "materialId": 1,
      "quantityPerUnit": 1.35,
      "wasteRatePercent": 3.0,
      "notes": "Vai thun chinh"
    },
    {
      "materialId": 2,
      "quantityPerUnit": 0.05,
      "wasteRatePercent": 1.0,
      "notes": "Chi may Cotton"
    }
  ]
}
```

## Inventory Transactions (Giao Dich Kho)

```http
GET /inventory/balances?page=1&limit=10&search=&warehouseId=&materialId=&category=&lowStock=false
GET /inventory/dashboard-summary
GET /inventory/transactions?page=1&limit=10&transactionType=&warehouseId=&supplierId=&orderId=&dateFrom=&dateTo=
GET /inventory/transactions/:id
POST /inventory/receipts
POST /inventory/issues
POST /inventory/adjustments
```

- **Receipt (Nhap kho)**: Tang ton kho. Yeu cau ma phieu, kho nhap, nha cung cap, danh sach vat tu kem so luong va gia nhap.
- **Issue (Xuat kho)**: Giam ton kho. Yeu cau ma phieu, kho xuat, don hang lien ket, danh sach vat tu va so luong.
  - He thong su dung lock database `SELECT FOR UPDATE` de kiem tra so du va tru kho atomic, ngan chan ton kho bi am.
- **Adjustment (Dieu chinh)**: Dieu chinh tang (`ADJUSTMENT_IN`) hoac giam (`ADJUSTMENT_OUT`). Yeu cau ghi chu ly do bat buoc.

Payload tạo phiếu nhập kho (`RECEIPT`):

```json
{
  "transactionCode": "NK-20260616-01",
  "warehouseId": 1,
  "supplierId": 1,
  "transactionDate": "2026-06-16",
  "referenceNumber": "HD-123456",
  "notes": "Nhap kho vai thun tu NCC Phong Phu",
  "items": [
    {
      "materialId": 1,
      "quantity": 1000.0,
      "unitCost": 45000.00,
      "notes": "Vai thun trang"
    }
  ]
}
```

Payload tạo phiếu xuất kho (`ISSUE`):

```json
{
  "transactionCode": "XK-20260616-01",
  "warehouseId": 1,
  "orderId": 1,
  "transactionDate": "2026-06-16",
  "items": [
    {
      "materialId": 1,
      "quantity": 250.0,
      "notes": "Xuat cho to cat may don hang ORD-001"
    }
  ]
}
```

Payload tạo phiếu điều chỉnh (`ADJUSTMENT`):

```json
{
  "transactionCode": "DC-20260616-01",
  "transactionType": "ADJUSTMENT_OUT",
  "warehouseId": 1,
  "transactionDate": "2026-06-16",
  "notes": "Hao hut kiem ke dinh ky quy 2",
  "items": [
    {
      "materialId": 1,
      "quantity": 5.0,
      "notes": "Vai bi loi o mep"
    }
  ]
}
```

## Material Requirements (Tinh Nhu Cau Nguyen Phu Lieu)

```http
GET /orders/:id/material-requirements
```

Tinh toan so luong nguyen phu lieu can may cho don hang dua tren danh sach san pham, so luong dat va dinh muc `ACTIVE` cua tung san pham. Tra ve:
- So luong can thiet thuc te (da tinh ty le hao hut: `requiredQuantity = quantity * quantityPerUnit * (1 + wasteRatePercent/100)`).
- So luong ton kho kha dung hien tai tren toan bo cac kho.
- So luong hieu thieu (`shortageQuantity`) kem trang thai `isShortage`.
- Canh bao neu co san pham trong don hang chua duoc thiet lap dinh muc `ACTIVE`.

