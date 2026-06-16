import bcrypt from 'bcrypt';
import { env } from '../src/config/env.js';
import { pool, query, transaction } from '../src/config/database.js';

const roles = [
  ['ADMIN', 'Quan tri vien'],
  ['OWNER', 'Chu xuong / Ban giam doc'],
  ['PRODUCTION_MANAGER', 'Quan ly san xuat'],
  ['HR', 'Nhan su'],
  ['LINE_LEADER', 'To truong chuyen'],
  ['QC', 'Nhan vien QC/KCS'],
  ['WAREHOUSE', 'Nhan vien kho'],
  ['TECHNICIAN', 'Nhan vien ky thuat'],
  ['ACCOUNTING_ERP', 'Ke toan / ERP'],
  ['WORKER', 'Cong nhan'],
];

const run = async () => {
  await transaction(async (connection) => {
    // =========================================================
    // 1. ROLES
    // =========================================================
    for (const [code, name] of roles) {
      await connection.execute(
        `INSERT INTO roles (code, name) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [code, name],
      );
    }

    const [[roleRows]] = await connection.execute('SELECT id, code FROM roles');
    // Re-fetch all
    const [allRoleRows] = await connection.execute('SELECT id, code FROM roles');
    const roleMap = Object.fromEntries(allRoleRows.map((r) => [r.code, r.id]));

    // =========================================================
    // 2. SYSTEM SETTINGS
    // =========================================================
    await connection.execute(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES ('app_name', 'Xuong May Management'),
              ('currency', 'VND'),
              ('timezone', 'Asia/Ho_Chi_Minh'),
              ('phase', 'phase4-production')
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`
    );

    // =========================================================
    // 3. USERS (admin + other roles + employees)
    // =========================================================
    const passwordHash = await bcrypt.hash(env.DEV_ADMIN_PASSWORD, 10);
    const workerPassword = await bcrypt.hash('Worker@123456', 10);

    // Admin
    await connection.execute(
      `INSERT INTO users (username, email, full_name, password_hash, role_id)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         email = VALUES(email), full_name = VALUES(full_name),
         password_hash = VALUES(password_hash), role_id = VALUES(role_id), is_locked = FALSE`,
      [env.DEV_ADMIN_USERNAME, env.DEV_ADMIN_EMAIL, 'Quan tri vien He thong', passwordHash, roleMap['ADMIN']],
    );

    // Other staff users
    const staffUsers = [
      ['quan_ly', 'quanly@xuongmay.vn', 'Tran Van Quan Ly', passwordHash, roleMap['PRODUCTION_MANAGER'], null],
      ['to_truong_1', 'totruong1@xuongmay.vn', 'Nguyen Thi To Truong 1', passwordHash, roleMap['LINE_LEADER'], null],
      ['nhan_kho', 'nhankho@xuongmay.vn', 'Le Van Nhan Kho', passwordHash, roleMap['WAREHOUSE'], null],
      ['qc_1', 'qc1@xuongmay.vn', 'Pham Thi QC 1', passwordHash, roleMap['QC'], null],
      ['ky_thuat', 'kythuat@xuongmay.vn', 'Hoang Van Ky Thuat', passwordHash, roleMap['TECHNICIAN'], null],
      // Employees stored directly in users table
      ['EMP-001', 'emp001@xuongmay.vn', 'Nguyen Thi Cong Nhan 01', workerPassword, roleMap['WORKER'],
        ['EMP-001', '1990-03-15', 'NU', '0912000001', '2021-01-05', 'WORKER', 'SKILLED', 'ACTIVE']],
      ['EMP-002', 'emp002@xuongmay.vn', 'Tran Van Cong Nhan 02', workerPassword, roleMap['WORKER'],
        ['EMP-002', '1988-07-20', 'NAM', '0912000002', '2021-01-05', 'WORKER', 'SKILLED', 'ACTIVE']],
      ['EMP-003', 'emp003@xuongmay.vn', 'Le Thi Cong Nhan 03', workerPassword, roleMap['WORKER'],
        ['EMP-003', '1993-11-10', 'NU', '0912000003', '2021-02-01', 'WORKER', 'INTERMEDIATE', 'ACTIVE']],
      ['EMP-004', 'emp004@xuongmay.vn', 'Pham Van Cong Nhan 04', workerPassword, roleMap['WORKER'],
        ['EMP-004', '1995-04-25', 'NAM', '0912000004', '2021-02-01', 'WORKER', 'INTERMEDIATE', 'ACTIVE']],
      ['EMP-005', 'emp005@xuongmay.vn', 'Hoang Thi Cong Nhan 05', workerPassword, roleMap['WORKER'],
        ['EMP-005', '1997-09-03', 'NU', '0912000005', '2022-03-01', 'WORKER', 'BEGINNER', 'ACTIVE']],
    ];

    for (const [username, email, fullName, hash, roleId, empData] of staffUsers) {
      await connection.execute(
        `INSERT INTO users (
          username, email, full_name, password_hash, role_id,
          employee_code, date_of_birth, gender, phone, hire_date, position, skill_level, employee_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          email = VALUES(email), full_name = VALUES(full_name),
          password_hash = VALUES(password_hash), role_id = VALUES(role_id)`,
        [
          username, email, fullName, hash, roleId,
          empData ? empData[0] : null,
          empData ? empData[1] : null,
          empData ? empData[2] : null,
          empData ? empData[3] : null,
          empData ? empData[4] : null,
          empData ? empData[5] : null,
          empData ? empData[6] : null,
          empData ? empData[7] : null,
        ]
      );
    }

    const [adminRows] = await connection.execute(`SELECT id FROM users WHERE username = ?`, [env.DEV_ADMIN_USERNAME]);
    const adminId = adminRows[0].id;

    // =========================================================
    // 4. CUSTOMERS
    // =========================================================
    const customersData = [
      ['CUS-001', 'Cong ty May Xuat Khau Viet Tien', 'Nguyen Van Giam Doc', '0281234567', 'info@viettien.vn', '2B Ha Bai Trung, Q1, TP.HCM', '0300123456', adminId],
      ['CUS-002', 'Cong ty TNHH An Phuoc Fashion', 'Tran Thi Thu Ky', '0288765432', 'order@anphuoc.vn', '100 Nguyen Tat Thanh, Q4, TP.HCM', '0307654321', adminId],
      ['CUS-003', 'May Mac Nhat Nhat Co Ltd', 'Le Van Truong Phong', '0289876543', 'purchase@nhatnhat.vn', 'KCN Tan Binh, TP.HCM', '0309876543', adminId],
    ];
    for (const c of customersData) {
      await connection.execute(
        `INSERT INTO customers (customer_code, customer_name, contact_person, phone, email, address, tax_code, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE customer_name = VALUES(customer_name), phone = VALUES(phone)`,
        c
      );
    }
    const [customerRows] = await connection.execute('SELECT id, customer_code FROM customers');
    const customerMap = Object.fromEntries(customerRows.map((r) => [r.customer_code, r.id]));

    // =========================================================
    // 5. PRODUCTS
    // =========================================================
    const productsData = [
      ['PRO-001', 'Ao So Mi Nam Trang', 'Ao so mi', 'cai', 'Ao so mi cotton trang tay dai', 45, adminId],
      ['PRO-002', 'Quan Tay Nam Den', 'Quan', 'cai', 'Quan tay cao cap kaki den', 60, adminId],
      ['PRO-003', 'Ao Polo Nu Xanh', 'Ao polo', 'cai', 'Ao polo cổ be nu mau xanh navy', 35, adminId],
    ];
    for (const p of productsData) {
      await connection.execute(
        `INSERT INTO products (product_code, product_name, category, unit, description, standard_time_minutes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), category = VALUES(category)`,
        p
      );
    }
    const [productRows] = await connection.execute('SELECT id, product_code FROM products');
    const productMap = Object.fromEntries(productRows.map((r) => [r.product_code, r.id]));

    // =========================================================
    // 6. ORDERS + ORDER_ITEMS
    // =========================================================
    const ordersData = [
      ['ORD-2026-001', customerMap['CUS-001'], '2026-06-01', '2026-06-30', 'HIGH', 'CONFIRMED', 'Don hang xuat khau chuyen ao so mi', adminId],
      ['ORD-2026-002', customerMap['CUS-002'], '2026-06-05', '2026-07-05', 'NORMAL', 'CONFIRMED', 'Don hang ao polo va quan tay', adminId],
      ['ORD-2026-003', customerMap['CUS-003'], '2026-06-10', '2026-07-10', 'LOW', 'DRAFT', 'Don hang moi dang xac nhan', adminId],
    ];
    for (const o of ordersData) {
      await connection.execute(
        `INSERT INTO orders (order_code, customer_id, order_date, expected_delivery_date, priority, status, notes, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [...o, adminId]
      );
    }
    const [orderRows] = await connection.execute('SELECT id, order_code FROM orders');
    const orderMap = Object.fromEntries(orderRows.map((r) => [r.order_code, r.id]));

    const [existOrdItems] = await connection.execute(
      'SELECT COUNT(*) AS cnt FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_code IN (?, ?, ?))',
      ['ORD-2026-001', 'ORD-2026-002', 'ORD-2026-003']
    );
    if (existOrdItems[0].cnt === 0) {
      const orderItemsData = [
        [orderMap['ORD-2026-001'], productMap['PRO-001'], 200, 115000, 'Trang', 'M'],
        [orderMap['ORD-2026-001'], productMap['PRO-001'], 150, 115000, 'Trang', 'L'],
        [orderMap['ORD-2026-002'], productMap['PRO-003'], 100, 95000, 'Xanh', 'S'],
        [orderMap['ORD-2026-002'], productMap['PRO-002'], 80, 175000, 'Den', 'L'],
        [orderMap['ORD-2026-003'], productMap['PRO-001'], 120, 112000, 'Trang', 'XL'],
      ];
      for (const oi of orderItemsData) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, color, size)
           VALUES (?, ?, ?, ?, ?, ?)`,
          oi
        );
      }
    }

    // =========================================================
    // 7. SUPPLIERS
    // =========================================================
    const suppliersData = [
      ['SPL-001', 'Cong ty Vai Thanh Cong', 'Nguyen Van B', '0901111222', 'supplier1@thanhcong.vn', 'Binh Tan, TP.HCM', '0301234567', 'Nha cung cap vai chinh', adminId],
      ['SPL-002', 'Cong ty Chi Phong Phu', 'Tran Van C', '0903333444', 'supplier2@phongphu.vn', 'Quan 9, TP.HCM', '0307654321', 'Nha cung cap chi may', adminId],
      ['SPL-003', 'Phu lieu may Kim Long', 'Le Thi D', '0905555666', 'supplier3@kimlong.vn', 'Tan Binh, TP.HCM', '0309876543', 'Nha cung cap cuc, khoa keo, nhan mac', adminId],
    ];
    for (const s of suppliersData) {
      await connection.execute(
        `INSERT INTO suppliers (supplier_code, supplier_name, contact_person, phone, email, address, tax_code, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE supplier_name = VALUES(supplier_name)`,
        s
      );
    }
    const [supplierRows] = await connection.execute('SELECT id, supplier_code FROM suppliers');
    const supplierMap = Object.fromEntries(supplierRows.map((r) => [r.supplier_code, r.id]));

    // =========================================================
    // 8. MATERIALS
    // =========================================================
    const materialsData = [
      ['MAT-FAB-001', 'Vai Cotton Trang 60/40', 'FABRIC', 'm', 'Trang', '60% Cotton 40% Polyester', 500, supplierMap['SPL-001'], adminId],
      ['MAT-FAB-002', 'Vai Kaki Den Day', 'FABRIC', 'm', 'Den', 'Kaki 270gsm', 300, supplierMap['SPL-001'], adminId],
      ['MAT-FAB-003', 'Vai Pique Polo Xanh Navy', 'FABRIC', 'm', 'Xanh', 'Pique cotton 220gsm', 200, supplierMap['SPL-001'], adminId],
      ['MAT-THR-001', 'Chi May 40/2 Trang', 'THREAD', 'cuon', 'Trang', 'Polyester spun 500m', 50, supplierMap['SPL-002'], adminId],
      ['MAT-THR-002', 'Chi May 40/2 Den', 'THREAD', 'cuon', 'Den', 'Polyester spun 500m', 50, supplierMap['SPL-002'], adminId],
      ['MAT-BUT-001', 'Nut Ao 4 Lo Nhua Trang', 'BUTTON', 'cai', 'Trang', '11.5mm nhua', 1000, supplierMap['SPL-003'], adminId],
      ['MAT-ZIP-001', 'Khoa Keo YKK Den 20cm', 'ZIPPER', 'cai', 'Den', 'YKK #3 20cm', 200, supplierMap['SPL-003'], adminId],
      ['MAT-LBL-001', 'Nhan Mac Cotton Trang', 'LABEL', 'cai', 'Trang', 'Det chu noi 5x2cm', 500, supplierMap['SPL-003'], adminId],
      ['MAT-PKG-001', 'Tui Nilon Dong Goi 30x40', 'PACKAGING', 'cai', 'Trong', 'PE 30x40cm', 1000, supplierMap['SPL-003'], adminId],
    ];
    for (const m of materialsData) {
      await connection.execute(
        `INSERT INTO materials (material_code, material_name, category, unit, color, specification, minimum_stock, default_supplier_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE material_name = VALUES(material_name)`,
        m
      );
    }
    const [materialRows] = await connection.execute('SELECT id, material_code FROM materials');
    const materialMap = Object.fromEntries(materialRows.map((r) => [r.material_code, r.id]));

    // =========================================================
    // 9. WAREHOUSES
    // =========================================================
    const warehousesData = [
      ['WH-MAIN', 'Kho Nguyen Lieu Chinh', 'Khu A Tang 1', 'Luu tru vai va phu lieu chinh', adminId],
      ['WH-SUB', 'Kho Phu Lieu Phu', 'Khu B Tang 2', 'Luu tru cuc, chi, nhan mac, bao bi', adminId],
    ];
    for (const w of warehousesData) {
      await connection.execute(
        `INSERT INTO warehouses (warehouse_code, warehouse_name, location, description, created_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE warehouse_name = VALUES(warehouse_name)`,
        w
      );
    }
    const [warehouseRows] = await connection.execute('SELECT id, warehouse_code FROM warehouses');
    const warehouseMap = Object.fromEntries(warehouseRows.map((r) => [r.warehouse_code, r.id]));

    // =========================================================
    // 10. BOMS + BOM_ITEMS
    // =========================================================
    // BOM for PRO-001 (Ao so mi)
    const [existBom1] = await connection.execute(
      'SELECT id FROM boms WHERE product_id = ? AND version = ?',
      [productMap['PRO-001'], 'V1.0']
    );
    let bom1Id;
    if (existBom1.length === 0) {
      const [r] = await connection.execute(
        `INSERT INTO boms (product_id, version, status, effective_date, notes, created_by, updated_by)
         VALUES (?, 'V1.0', 'ACTIVE', '2026-01-01', 'BOM ao so mi nam trang V1.0', ?, ?)`,
        [productMap['PRO-001'], adminId, adminId]
      );
      bom1Id = r.insertId;
    } else {
      bom1Id = existBom1[0].id;
    }
    const bom1Items = [
      [bom1Id, materialMap['MAT-FAB-001'], 1.20, 5.0, 'Vai chinh than ao'],
      [bom1Id, materialMap['MAT-THR-001'], 0.10, 2.0, 'Chi may'],
      [bom1Id, materialMap['MAT-BUT-001'], 6.00, 0.0, 'Nut ao 6 cai'],
      [bom1Id, materialMap['MAT-LBL-001'], 1.00, 0.0, 'Nhan mac'],
      [bom1Id, materialMap['MAT-PKG-001'], 1.00, 0.0, 'Tui dong goi'],
    ];
    for (const bi of bom1Items) {
      await connection.execute(
        `INSERT INTO bom_items (bom_id, material_id, quantity_per_unit, waste_rate_percent, notes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity_per_unit = VALUES(quantity_per_unit)`,
        bi
      );
    }

    // BOM for PRO-002 (Quan tay)
    const [existBom2] = await connection.execute(
      'SELECT id FROM boms WHERE product_id = ? AND version = ?',
      [productMap['PRO-002'], 'V1.0']
    );
    let bom2Id;
    if (existBom2.length === 0) {
      const [r] = await connection.execute(
        `INSERT INTO boms (product_id, version, status, effective_date, notes, created_by, updated_by)
         VALUES (?, 'V1.0', 'ACTIVE', '2026-01-01', 'BOM quan tay nam den V1.0', ?, ?)`,
        [productMap['PRO-002'], adminId, adminId]
      );
      bom2Id = r.insertId;
    } else {
      bom2Id = existBom2[0].id;
    }
    const bom2Items = [
      [bom2Id, materialMap['MAT-FAB-002'], 1.50, 4.0, 'Vai chinh quan'],
      [bom2Id, materialMap['MAT-THR-002'], 0.15, 3.0, 'Chi may den'],
      [bom2Id, materialMap['MAT-BUT-001'], 1.00, 0.0, 'Nut lung'],
      [bom2Id, materialMap['MAT-ZIP-001'], 1.00, 0.0, 'Khoa keo'],
      [bom2Id, materialMap['MAT-LBL-001'], 1.00, 0.0, 'Nhan mac'],
      [bom2Id, materialMap['MAT-PKG-001'], 1.00, 0.0, 'Tui dong goi'],
    ];
    for (const bi of bom2Items) {
      await connection.execute(
        `INSERT INTO bom_items (bom_id, material_id, quantity_per_unit, waste_rate_percent, notes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity_per_unit = VALUES(quantity_per_unit)`,
        bi
      );
    }

    // =========================================================
    // 11. INVENTORY TRANSACTIONS (Nhap kho ban dau)
    // =========================================================
    const [existTx1] = await connection.execute(
      'SELECT id FROM inventory_transactions WHERE transaction_code = ?', ['RCV-2026-001']
    );
    if (existTx1.length === 0) {
      const [txRes] = await connection.execute(
        `INSERT INTO inventory_transactions
           (transaction_code, transaction_type, warehouse_id, supplier_id, transaction_date, reference_number, notes, status, created_by, posted_by, posted_at)
         VALUES ('RCV-2026-001', 'RECEIPT', ?, ?, '2026-06-01', 'PO-NCC-001', 'Nhap kho vai chinh dot 1', 'POSTED', ?, ?, NOW())`,
        [warehouseMap['WH-MAIN'], supplierMap['SPL-001'], adminId, adminId]
      );
      const txId = txRes.insertId;
      const txItems = [
        [txId, materialMap['MAT-FAB-001'], 1500.0, 45000.0],
        [txId, materialMap['MAT-FAB-002'], 800.0, 60000.0],
        [txId, materialMap['MAT-FAB-003'], 600.0, 55000.0],
        [txId, materialMap['MAT-THR-001'], 200.0, 15000.0],
        [txId, materialMap['MAT-THR-002'], 200.0, 15000.0],
      ];
      for (const ti of txItems) {
        await connection.execute(
          `INSERT INTO inventory_transaction_items (inventory_transaction_id, material_id, quantity, unit_cost) VALUES (?, ?, ?, ?)`,
          ti
        );
      }
    }

    const [existTx2] = await connection.execute(
      'SELECT id FROM inventory_transactions WHERE transaction_code = ?', ['RCV-2026-002']
    );
    if (existTx2.length === 0) {
      const [txRes2] = await connection.execute(
        `INSERT INTO inventory_transactions
           (transaction_code, transaction_type, warehouse_id, supplier_id, transaction_date, reference_number, notes, status, created_by, posted_by, posted_at)
         VALUES ('RCV-2026-002', 'RECEIPT', ?, ?, '2026-06-02', 'PO-NCC-002', 'Nhap kho phu lieu doi 1', 'POSTED', ?, ?, NOW())`,
        [warehouseMap['WH-SUB'], supplierMap['SPL-003'], adminId, adminId]
      );
      const tx2Id = txRes2.insertId;
      const txItems2 = [
        [tx2Id, materialMap['MAT-BUT-001'], 5000.0, 500.0],
        [tx2Id, materialMap['MAT-ZIP-001'], 500.0, 5000.0],
        [tx2Id, materialMap['MAT-LBL-001'], 3000.0, 1000.0],
        [tx2Id, materialMap['MAT-PKG-001'], 5000.0, 800.0],
      ];
      for (const ti of txItems2) {
        await connection.execute(
          `INSERT INTO inventory_transaction_items (inventory_transaction_id, material_id, quantity, unit_cost) VALUES (?, ?, ?, ?)`,
          ti
        );
      }
    }

    // =========================================================
    // 12. PRODUCTION LINES
    // =========================================================
    const linesData = [
      ['PL-001', 'Chuyen may 01', 'Tang 1 - Zone A', 8, 12, 'ACTIVE', 'Chuyen chuyen may ao so mi', adminId],
      ['PL-002', 'Chuyen may 02', 'Tang 1 - Zone B', 8, 12, 'ACTIVE', 'Chuyen may quan tay cao cap', adminId],
      ['PL-003', 'Chuyen may 03', 'Tang 2 - Zone A', 6, 10, 'ACTIVE', 'Chuyen may ao thun polo', adminId],
    ];
    for (const l of linesData) {
      await connection.execute(
        `INSERT INTO production_lines (line_code, line_name, location, target_workers, maximum_workers, status, description, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE line_name = VALUES(line_name), status = VALUES(status)`,
        l
      );
    }
    const [lineRows] = await connection.execute('SELECT id, line_code FROM production_lines');
    const lineMap = Object.fromEntries(lineRows.map((r) => [r.line_code, r.id]));

    // =========================================================
    // 13. SHIFTS
    // =========================================================
    const shiftsData = [
      ['SH-CA1', 'Ca 1 (Sang)', '06:00:00', '14:00:00', 30, true, adminId],
      ['SH-CA2', 'Ca 2 (Chieu)', '14:00:00', '22:00:00', 30, true, adminId],
      ['SH-CA3', 'Ca 3 (Dem)', '22:00:00', '06:00:00', 30, false, adminId],
    ];
    for (const sh of shiftsData) {
      await connection.execute(
        `INSERT INTO shifts (shift_code, shift_name, start_time, end_time, break_minutes, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE shift_name = VALUES(shift_name)`,
        sh
      );
    }
    const [shiftRows] = await connection.execute('SELECT id, shift_code FROM shifts');
    const shiftMap = Object.fromEntries(shiftRows.map((r) => [r.shift_code, r.id]));

    // =========================================================
    // 14. OPERATIONS + PRODUCT_OPERATIONS
    // =========================================================
    const operationsData = [
      ['OP-CAT', 'Cat vai', 'Cat vai theo mau giay thiet ke', 120, 'MEDIUM', true, adminId],
      ['OP-MAY-CO', 'May co ao', 'May rap co ao vao than ao', 180, 'HIGH', true, adminId],
      ['OP-MAY-TAY', 'May tay ao', 'May rap tay vao than ao', 150, 'MEDIUM', true, adminId],
      ['OP-MAY-THAN', 'May than ao', 'May rap than truoc va than sau', 240, 'HIGH', true, adminId],
      ['OP-DINH-NUT', 'Dinh nut ao', 'Dinh nut va mo khuy', 90, 'LOW', true, adminId],
      ['OP-MAY-LUNG', 'May lung quan', 'May rap lung quan', 120, 'MEDIUM', true, adminId],
      ['OP-GAP-DANG', 'Gap dang quan', 'Gap dang quan theo size', 200, 'HIGH', true, adminId],
    ];
    for (const op of operationsData) {
      await connection.execute(
        `INSERT INTO operations (operation_code, operation_name, description, standard_time_seconds, difficulty_level, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE operation_name = VALUES(operation_name)`,
        op
      );
    }
    const [opRows] = await connection.execute('SELECT id, operation_code FROM operations');
    const opMap = Object.fromEntries(opRows.map((r) => [r.operation_code, r.id]));

    // Product operations for PRO-001 (Ao so mi)
    const pro1Ops = [
      [productMap['PRO-001'], opMap['OP-CAT'], 1, 120, 'BEGINNER', 'Cat vai ao so mi'],
      [productMap['PRO-001'], opMap['OP-MAY-CO'], 2, 180, 'SKILLED', 'May co ao so mi'],
      [productMap['PRO-001'], opMap['OP-MAY-TAY'], 3, 150, 'INTERMEDIATE', 'May tay ao so mi'],
      [productMap['PRO-001'], opMap['OP-MAY-THAN'], 4, 240, 'SKILLED', 'May than ao so mi'],
      [productMap['PRO-001'], opMap['OP-DINH-NUT'], 5, 90, 'BEGINNER', 'Dinh nut ao so mi'],
    ];
    for (const po of pro1Ops) {
      await connection.execute(
        `INSERT INTO product_operations (product_id, operation_id, sequence_number, standard_time_seconds, required_skill_level, notes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE standard_time_seconds = VALUES(standard_time_seconds)`,
        po
      );
    }

    // Product operations for PRO-002 (Quan tay)
    const pro2Ops = [
      [productMap['PRO-002'], opMap['OP-CAT'], 1, 120, 'BEGINNER', 'Cat vai quan tay'],
      [productMap['PRO-002'], opMap['OP-MAY-LUNG'], 2, 120, 'INTERMEDIATE', 'May lung quan'],
      [productMap['PRO-002'], opMap['OP-GAP-DANG'], 3, 200, 'SKILLED', 'Gap dang quan tay'],
    ];
    for (const po of pro2Ops) {
      await connection.execute(
        `INSERT INTO product_operations (product_id, operation_id, sequence_number, standard_time_seconds, required_skill_level, notes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE standard_time_seconds = VALUES(standard_time_seconds)`,
        po
      );
    }

    // =========================================================
    // 15. PRODUCTION ORDERS
    // =========================================================
    const [existPO1] = await connection.execute(
      'SELECT id FROM production_orders WHERE production_order_code = ?', ['PO-2026-001']
    );
    let po1Id;
    if (existPO1.length === 0) {
      const [r] = await connection.execute(
        `INSERT INTO production_orders
           (production_order_code, order_id, product_id, planned_quantity, completed_quantity, rejected_quantity,
            planned_start_date, planned_end_date, priority, status, notes, created_by, updated_by)
         VALUES ('PO-2026-001', ?, ?, 200, 45, 3, '2026-06-10', '2026-06-25', 'HIGH', 'IN_PROGRESS',
                 'Lenh san xuat ao so mi trang 200 cai', ?, ?)`,
        [orderMap['ORD-2026-001'], productMap['PRO-001'], adminId, adminId]
      );
      po1Id = r.insertId;
    } else {
      po1Id = existPO1[0].id;
    }

    const [existPO2] = await connection.execute(
      'SELECT id FROM production_orders WHERE production_order_code = ?', ['PO-2026-002']
    );
    let po2Id;
    if (existPO2.length === 0) {
      const [r] = await connection.execute(
        `INSERT INTO production_orders
           (production_order_code, order_id, product_id, planned_quantity, completed_quantity, rejected_quantity,
            planned_start_date, planned_end_date, priority, status, notes, created_by, updated_by)
         VALUES ('PO-2026-002', ?, ?, 80, 0, 0, '2026-06-15', '2026-06-30', 'NORMAL', 'RELEASED',
                 'Lenh san xuat quan tay den 80 cai', ?, ?)`,
        [orderMap['ORD-2026-002'], productMap['PRO-002'], adminId, adminId]
      );
      po2Id = r.insertId;
    } else {
      po2Id = existPO2[0].id;
    }

    // =========================================================
    // 16. PRODUCTION SCHEDULES
    // =========================================================
    const [existSched1] = await connection.execute(
      'SELECT COUNT(*) AS cnt FROM production_schedules WHERE production_order_id = ?', [po1Id]
    );
    if (existSched1[0].cnt === 0) {
      // Schedule 1: PO-2026-001 / Line 01 / Ca sang
      await connection.execute(
        `INSERT INTO production_schedules
           (production_order_id, production_line_id, shift_id, schedule_date, allocated_quantity, target_quantity,
            planned_workers, planned_start_date, planned_end_date, status, notes, created_by, updated_by)
         VALUES (?, ?, ?, '2026-06-16', 120, 20, 8, '2026-06-10', '2026-06-20', 'IN_PROGRESS',
                 'Chuyen 01 ca sang may ao so mi', ?, ?)`,
        [po1Id, lineMap['PL-001'], shiftMap['SH-CA1'], adminId, adminId]
      );
      // Schedule 2: PO-2026-001 / Line 02 / Ca chieu
      await connection.execute(
        `INSERT INTO production_schedules
           (production_order_id, production_line_id, shift_id, schedule_date, allocated_quantity, target_quantity,
            planned_workers, planned_start_date, planned_end_date, status, notes, created_by, updated_by)
         VALUES (?, ?, ?, '2026-06-16', 80, 15, 8, '2026-06-10', '2026-06-25', 'CONFIRMED',
                 'Chuyen 02 ca chieu ho tro may ao so mi', ?, ?)`,
        [po1Id, lineMap['PL-002'], shiftMap['SH-CA2'], adminId, adminId]
      );
    }

    const [existSched2] = await connection.execute(
      'SELECT COUNT(*) AS cnt FROM production_schedules WHERE production_order_id = ?', [po2Id]
    );
    if (existSched2[0].cnt === 0) {
      // Schedule for PO-2026-002
      await connection.execute(
        `INSERT INTO production_schedules
           (production_order_id, production_line_id, shift_id, schedule_date, allocated_quantity, target_quantity,
            planned_workers, planned_start_date, planned_end_date, status, notes, created_by, updated_by)
         VALUES (?, ?, ?, '2026-06-16', 80, 15, 8, '2026-06-15', '2026-06-30', 'CONFIRMED',
                 'Chuyen 02 ca sang may quan tay', ?, ?)`,
        [po2Id, lineMap['PL-002'], shiftMap['SH-CA1'], adminId, adminId]
      );
    }

    // =========================================================
    // 17. PRODUCTION OUTPUTS (dữ liệu sản lượng mẫu)
    // =========================================================
    const [schedRows] = await connection.execute(
      'SELECT id, production_line_id, shift_id FROM production_schedules WHERE production_order_id = ?', [po1Id]
    );
    if (schedRows.length > 0) {
      const [existOut] = await connection.execute(
        'SELECT COUNT(*) AS cnt FROM production_outputs WHERE production_order_id = ?', [po1Id]
      );
      if (existOut[0].cnt === 0) {
        const s1 = schedRows[0];
        // Output ngay 1
        await connection.execute(
          `INSERT INTO production_outputs
             (production_schedule_id, production_order_id, production_line_id, shift_id, output_date,
              good_quantity, defect_quantity, rework_quantity, working_minutes, downtime_minutes, recorded_by)
           VALUES (?, ?, ?, ?, '2026-06-10', 22, 2, 1, 450, 30, ?)`,
          [s1.id, po1Id, s1.production_line_id, s1.shift_id, adminId]
        );
        // Output ngay 2
        await connection.execute(
          `INSERT INTO production_outputs
             (production_schedule_id, production_order_id, production_line_id, shift_id, output_date,
              good_quantity, defect_quantity, rework_quantity, working_minutes, downtime_minutes, recorded_by)
           VALUES (?, ?, ?, ?, '2026-06-11', 23, 1, 0, 470, 10, ?)`,
          [s1.id, po1Id, s1.production_line_id, s1.shift_id, adminId]
        );

        // Cập nhật PO completed_quantity tương ứng
        await connection.execute(
          `UPDATE production_orders
           SET completed_quantity = 45, rejected_quantity = 3, status = 'IN_PROGRESS', actual_start_date = '2026-06-10'
           WHERE id = ?`,
          [po1Id]
        );
      }
    }

    // =========================================================
    // 18. SYSTEM SETTINGS (thêm một số cài đặt hệ thống)
    // =========================================================
    const settings = [
      ['working_hours_per_day', '8'],
      ['working_days_per_week', '6'],
      ['default_shift_minutes', '480'],
      ['overtime_rate', '1.5'],
      ['qc_pass_rate_threshold', '95'],
    ];
    for (const [key, val] of settings) {
      await connection.execute(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, val]
      );
    }
  });

  const [adminUser] = await query('SELECT username, email FROM users WHERE username = ?', [
    env.DEV_ADMIN_USERNAME,
  ]);

  console.log('');
  console.log('=== SEED COMPLETED ===');
  console.log(`Admin: ${adminUser.username} / ${adminUser.email}`);
  console.log(`Password: ${env.DEV_ADMIN_PASSWORD}`);
  console.log('');
  console.log('Tables seeded:');
  console.log('  roles, system_settings, users (+ employees), customers, products');
  console.log('  orders, order_items, suppliers, materials, warehouses');
  console.log('  boms, bom_items, inventory_transactions, inventory_transaction_items');
  console.log('  production_lines, shifts, operations, product_operations');
  console.log('  production_orders, production_schedules, production_outputs');
};

run()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  });
