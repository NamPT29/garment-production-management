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
- `suppliers` (Nha cung cap)
- `materials` (Nguyên phụ liệu)
- `warehouses` (Kho hàng)
- `boms` (Định mức kỹ thuật vật tư)
- `inventory` (Giao dịch kho: Nhập, xuất, điều chỉnh, số dư kho)
- `material-requirements` (Tính nhu cầu nguyên phụ liệu theo đơn hàng)

## Luong nghiep vu Phase 3

1. **Suppliers & Materials**: Thiết lập danh sách nhà cung cấp và nguyên phụ liệu dệt may. Quản lý ngưỡng tồn tối thiểu để hiển thị cảnh báo thiếu hụt.
2. **BOM (Product Bill of Materials)**: Thiết kế định mức vật tư cho sản phẩm. Khi kích hoạt định mức mới, hệ thống chuyển các định mức cũ của sản phẩm đó sang `INACTIVE` tự động trong transaction.
3. **Inventory Management**:
   - Khi tạo phiếu nhập kho (`RECEIPT`), xuất kho (`ISSUE`), hay điều chỉnh (`ADJUSTMENT`), hệ thống tự động cập nhật số dư tồn kho (`inventory_balances`).
   - Phiếu xuất kho và điều chỉnh giảm áp dụng khoá dòng `SELECT FOR UPDATE` trên các bản ghi số dư kho tương ứng, kiểm tra tồn kho khả dụng để bảo đảm số dư tồn kho không bị âm.
4. **Material Requirements**: Hỗ trợ bộ phận sản xuất tính toán tổng lượng nguyên phụ liệu cần chuẩn bị cho một đơn hàng dựa trên số lượng đặt và định mức `ACTIVE` của sản phẩm. Hiển thị đối chiếu thiếu/đủ so với tồn kho thực tế của toàn bộ nhà máy.

Order service su dung transaction khi tao/sua don hang va khi cap nhat trang thai. Lich su trang thai duoc luu trong `order_status_histories`.

## AI Service

Python + FastAPI giu vai tro service rieng. Phase 2 chua trien khai AI nghiep vu hoan chinh; backend moi proxy health check toi `AI_SERVICE_URL`.
