import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import app from '../../src/app.js';
import { disconnectDatabase, query } from '../../src/config/database.js';

const unique = Date.now();
const adminCredentials = { identifier: 'admin', password: 'Admin@123456' };
let adminToken;
let supplierId;
let materialId;
let warehouseId;
let productId;
let orderId;
let bomId1;
let bomId2;

const auth = () => ({ Authorization: `Bearer ${adminToken}` });

describe('phase 3 business APIs', () => {
  beforeAll(async () => {
    const loginResponse = await request(app).post('/api/v1/auth/login').send(adminCredentials).expect(200);
    adminToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // --- SUPPLIERS ---
  describe('Suppliers API', () => {
    it('creates a valid supplier', async () => {
      const response = await request(app)
        .post('/api/v1/suppliers')
        .set(auth())
        .send({
          supplierCode: `SUP-T-${unique}`,
          supplierName: 'Nha cung cap test',
          contactPerson: 'Tester SUP',
          phone: '0901234567',
          email: `supplier-${unique}@example.com`,
          address: 'Hanoi, Vietnam',
          taxCode: `TAX-${unique}`,
          notes: 'Notes for supplier',
        })
        .expect(201);

      supplierId = response.body.data.id;
      expect(response.body.data.supplierCode).toBe(`SUP-T-${unique}`);
      expect(response.body.data.isActive).toBe(true);
    });

    it('rejects duplicate supplier_code', async () => {
      const response = await request(app)
        .post('/api/v1/suppliers')
        .set(auth())
        .send({
          supplierCode: `SUP-T-${unique}`,
          supplierName: 'Nha cung cap trung ma',
        })
        .expect(409);

      expect(response.body.errorCode).toBe('SUPPLIER_CODE_DUPLICATED');
    });

    it('lists, gets detail, updates and deactivates supplier', async () => {
      const listRes = await request(app).get('/api/v1/suppliers?page=1&limit=10').set(auth()).expect(200);
      expect(listRes.body.data.items.length).toBeGreaterThan(0);

      const getRes = await request(app).get(`/api/v1/suppliers/${supplierId}`).set(auth()).expect(200);
      expect(getRes.body.data.supplierName).toBe('Nha cung cap test');

      const updateRes = await request(app)
        .patch(`/api/v1/suppliers/${supplierId}`)
        .set(auth())
        .send({ supplierName: 'Nha cung cap cap nhat' })
        .expect(200);
      expect(updateRes.body.data.supplierName).toBe('Nha cung cap cap nhat');

      // Create a dummy supplier to deactivate
      const dummyRes = await request(app)
        .post('/api/v1/suppliers')
        .set(auth())
        .send({
          supplierCode: `SUP-DUM-${unique}`,
          supplierName: 'Supplier Dummy',
        })
        .expect(201);

      const dummyId = dummyRes.body.data.id;
      const deactivateRes = await request(app)
        .patch(`/api/v1/suppliers/${dummyId}/deactivate`)
        .set(auth())
        .expect(200);
      expect(deactivateRes.body.data.isActive).toBe(false);
    });
  });

  // --- MATERIALS ---
  describe('Materials API', () => {
    it('creates a valid material', async () => {
      const response = await request(app)
        .post('/api/v1/materials')
        .set(auth())
        .send({
          materialCode: `MAT-T-${unique}`,
          materialName: 'Vai Cotton Test',
          category: 'FABRIC',
          unit: 'met',
          color: 'Trang',
          specification: '100% Cotton',
          minimumStock: 100,
          defaultSupplierId: supplierId,
          notes: 'Vải test chất lượng cao',
        });

      expect(response.status).toBe(201);

      materialId = response.body.data.id;
      expect(response.body.data.materialCode).toBe(`MAT-T-${unique}`);
      expect(response.body.data.minimumStock).toBe(100);
      expect(response.body.data.isActive).toBe(true);
    });

    it('rejects duplicate material_code', async () => {
      const response = await request(app)
        .post('/api/v1/materials')
        .set(auth())
        .send({
          materialCode: `MAT-T-${unique}`,
          materialName: 'Vai Cotton trung ma',
          category: 'FABRIC',
          unit: 'met',
        })
        .expect(409);

      expect(response.body.errorCode).toBe('MATERIAL_CODE_DUPLICATED');
    });

    it('lists, gets detail, updates and deactivates material', async () => {
      const listRes = await request(app).get('/api/v1/materials?page=1&limit=10').set(auth()).expect(200);
      expect(listRes.body.data.items.length).toBeGreaterThan(0);

      const getRes = await request(app).get(`/api/v1/materials/${materialId}`).set(auth()).expect(200);
      expect(getRes.body.data.materialName).toBe('Vai Cotton Test');

      const updateRes = await request(app)
        .patch(`/api/v1/materials/${materialId}`)
        .set(auth())
        .send({ color: 'Do' })
        .expect(200);
      expect(updateRes.body.data.color).toBe('Do');

      // Create a dummy material to deactivate
      const dummyRes = await request(app)
        .post('/api/v1/materials')
        .set(auth())
        .send({
          materialCode: `MAT-DUM-${unique}`,
          materialName: 'Material Dummy',
          category: 'THREAD',
          unit: 'cuon',
        })
        .expect(201);

      const dummyId = dummyRes.body.data.id;
      const deactivateRes = await request(app)
        .patch(`/api/v1/materials/${dummyId}/deactivate`)
        .set(auth())
        .expect(200);
      expect(deactivateRes.body.data.isActive).toBe(false);
    });
  });

  // --- WAREHOUSES ---
  describe('Warehouses API', () => {
    it('creates a warehouse', async () => {
      const response = await request(app)
        .post('/api/v1/warehouses')
        .set(auth())
        .send({
          warehouseCode: `WH-T-${unique}`,
          warehouseName: 'Kho Test 1',
          location: 'Khu A',
          description: 'Kho test so 1',
        })
        .expect(201);

      warehouseId = response.body.data.id;
      expect(response.body.data.warehouseCode).toBe(`WH-T-${unique}`);
      expect(response.body.data.isActive).toBe(true);
    });

    it('lists and gets warehouse details/balances', async () => {
      const listRes = await request(app).get('/api/v1/warehouses').set(auth()).expect(200);
      expect(listRes.body.data.items.length).toBeGreaterThan(0);

      const detailRes = await request(app).get(`/api/v1/warehouses/${warehouseId}`).set(auth()).expect(200);
      expect(detailRes.body.data.warehouseName).toBe('Kho Test 1');

      const balancesRes = await request(app).get(`/api/v1/warehouses/${warehouseId}/balances`).set(auth()).expect(200);
      expect(balancesRes.body.data.items).toBeDefined();
    });
  });

  // --- BOM ---
  describe('BOM API', () => {
    beforeAll(async () => {
      // Create a product to associate with BOM
      const prodRes = await request(app)
        .post('/api/v1/products')
        .set(auth())
        .send({
          productCode: `PRO-BOM-${unique}`,
          productName: 'Ao thun test BOM',
          category: 'Ao',
          unit: 'cai',
        })
        .expect(201);
      productId = prodRes.body.data.id;
    });

    it('creates a BOM draft', async () => {
      const response = await request(app)
        .post('/api/v1/boms')
        .set(auth())
        .send({
          productId,
          version: 'v1.0',
          effectiveDate: '2026-06-16',
          notes: 'BOM phien ban 1',
          items: [
            {
              materialId,
              quantityPerUnit: 1.5,
              wasteRatePercent: 5.0,
              notes: 'Vai chinh',
            },
          ],
        });

      console.log('BOM DRAFT CREATE ERROR:', JSON.stringify(response.body, null, 2));
      expect(response.status).toBe(201);

      bomId1 = response.body.data.id;
      expect(response.body.data.version).toBe('v1.0');
      expect(response.body.data.status).toBe('DRAFT');
    });

    it('rejects duplicate product-version BOM', async () => {
      await request(app)
        .post('/api/v1/boms')
        .set(auth())
        .send({
          productId,
          version: 'v1.0',
          effectiveDate: '2026-06-16',
          items: [{ materialId, quantityPerUnit: 1.2, wasteRatePercent: 0 }],
        })
        .expect(409);
    });

    it('allows updating DRAFT BOM', async () => {
      const response = await request(app)
        .patch(`/api/v1/boms/${bomId1}`)
        .set(auth())
        .send({
          notes: 'Notes da duoc sua',
        })
        .expect(200);

      expect(response.body.data.notes).toBe('Notes da duoc sua');
    });

    it('transitions active status atomically', async () => {
      // Create a second BOM draft for the same product
      const secondBomRes = await request(app)
        .post('/api/v1/boms')
        .set(auth())
        .send({
          productId,
          version: 'v2.0',
          effectiveDate: '2026-07-01',
          items: [{ materialId, quantityPerUnit: 1.4, wasteRatePercent: 2.0 }],
        })
        .expect(201);

      bomId2 = secondBomRes.body.data.id;

      // 1. Activate v1.0
      const activate1Res = await request(app)
        .patch(`/api/v1/boms/${bomId1}/activate`)
        .set(auth())
        .expect(200);
      expect(activate1Res.body.data.status).toBe('ACTIVE');

      // Check that it's no longer editable
      await request(app)
        .patch(`/api/v1/boms/${bomId1}`)
        .set(auth())
        .send({ notes: 'Sua BOM da active' })
        .expect(400);

      // Check we cannot directly deactivate it
      await request(app)
        .patch(`/api/v1/boms/${bomId1}/deactivate`)
        .set(auth())
        .expect(400);

      // 2. Activate v2.0
      const activate2Res = await request(app)
        .patch(`/api/v1/boms/${bomId2}/activate`)
        .set(auth())
        .expect(200);
      expect(activate2Res.body.data.status).toBe('ACTIVE');

      // Verify v1.0 is now automatically INACTIVE
      const get1Res = await request(app).get(`/api/v1/boms/${bomId1}`).set(auth()).expect(200);
      expect(get1Res.body.data.status).toBe('INACTIVE');
    });
  });

  // --- INVENTORY RECEIPTS, ISSUES AND ADJUSTMENTS ---
  describe('Inventory Transactions API', () => {
    it('creates a receipt and increases warehouse balances', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/receipts')
        .set(auth())
        .send({
          transactionCode: `REC-T-${unique}`,
          warehouseId,
          supplierId,
          transactionDate: '2026-06-16',
          referenceNumber: 'REF-001',
          notes: 'Phieu nhap kho test',
          items: [
            {
              materialId,
              quantity: 200,
              unitCost: 15000,
              notes: 'Nhap vai',
            },
          ],
        })
        .expect(201);

      expect(response.body.data.transactionType).toBe('RECEIPT');
      expect(response.body.data.status).toBe('POSTED');

      // Verify balance in warehouse
      const balancesRes = await request(app).get(`/api/v1/inventory/balances?warehouseId=${warehouseId}&materialId=${materialId}`).set(auth()).expect(200);
      expect(balancesRes.body.data.items[0].quantityOnHand).toBe(200);
    });

    it('creates a requirement calculation for an order', async () => {
      // Create a customer
      const cusRes = await request(app)
        .post('/api/v1/customers')
        .set(auth())
        .send({
          customerCode: `CUS-REQ-${unique}`,
          customerName: 'Customer Req Test',
        })
        .expect(201);
      const custId = cusRes.body.data.id;

      // Create an order of 100 units
      const ordRes = await request(app)
        .post('/api/v1/orders')
        .set(auth())
        .send({
          orderCode: `ORD-REQ-${unique}`,
          customerId: custId,
          orderDate: '2026-06-16',
          expectedDeliveryDate: '2026-07-01',
          items: [
            {
              productId,
              quantity: 100,
              unitPrice: 50000,
            },
          ],
        })
        .expect(201);
      orderId = ordRes.body.data.id;

      // Calculate material requirements
      // v2.0 BOM is active, which has 1.4 units/unit and 2.0% waste.
      // Total required = 100 * 1.4 * (1 + 0.02) = 142.8
      const reqRes = await request(app)
        .get(`/api/v1/orders/${orderId}/material-requirements`)
        .set(auth())
        .expect(200);

      console.log('REQUIREMENTS RESPONSE BODY:', JSON.stringify(reqRes.body, null, 2));

      expect(reqRes.body.data.requirements.length).toBe(1);
      const reqItem = reqRes.body.data.requirements[0];
      expect(reqItem.requiredQuantity).toBe(142.8);
      expect(reqItem.availableQuantity).toBe(200); // 200 entered in receipt
      expect(reqItem.shortageQuantity).toBe(0);
      expect(reqItem.isShortage).toBe(false);
    });

    it('rejects an issue that exceeds on-hand stock and rolls back', async () => {
      // Total quantity on hand is 200. Let's try to issue 250.
      const response = await request(app)
        .post('/api/v1/inventory/issues')
        .set(auth())
        .send({
          transactionCode: `ISS-ERR-${unique}`,
          warehouseId,
          orderId,
          transactionDate: '2026-06-16',
          items: [
            {
              materialId,
              quantity: 250,
            },
          ],
        })
        .expect(400);

      expect(response.body.errorCode).toBe('INSUFFICIENT_STOCK');

      // Verify transaction table does NOT contain ISS-ERR
      const txRows = await query('SELECT id FROM inventory_transactions WHERE transaction_code = ?', [`ISS-ERR-${unique}`]);
      expect(txRows.length).toBe(0);

      // Verify balance remains 200
      const balancesRes = await request(app).get(`/api/v1/inventory/balances?warehouseId=${warehouseId}&materialId=${materialId}`).set(auth()).expect(200);
      expect(balancesRes.body.data.items[0].quantityOnHand).toBe(200);
    });

    it('creates an issue and decreases warehouse balances', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/issues')
        .set(auth())
        .send({
          transactionCode: `ISS-T-${unique}`,
          warehouseId,
          orderId,
          transactionDate: '2026-06-16',
          items: [
            {
              materialId,
              quantity: 142.8,
            },
          ],
        });

      console.log('ISSUE CREATE ERROR:', JSON.stringify(response.body, null, 2));
      expect(response.status).toBe(201);

      expect(response.body.data.transactionType).toBe('ISSUE');
      expect(response.body.data.status).toBe('POSTED');

      // Verify balance in warehouse (200 - 142.8 = 57.2)
      const balancesRes = await request(app).get(`/api/v1/inventory/balances?warehouseId=${warehouseId}&materialId=${materialId}`).set(auth()).expect(200);
      expect(balancesRes.body.data.items[0].quantityOnHand).toBe(57.2);
    });

    it('handles ADJUSTMENT_IN and ADJUSTMENT_OUT transactions', async () => {
      // 1. ADJUSTMENT_IN: add 50 units
      const adjInRes = await request(app)
        .post('/api/v1/inventory/adjustments')
        .set(auth())
        .send({
          transactionCode: `ADJ-IN-${unique}`,
          transactionType: 'ADJUSTMENT_IN',
          warehouseId,
          transactionDate: '2026-06-16',
          notes: 'Kiem ke kho tang',
          items: [{ materialId, quantity: 50 }],
        })
        .expect(201);
      expect(adjInRes.body.data.transactionType).toBe('ADJUSTMENT_IN');

      // Verify balance (57.2 + 50 = 107.2)
      let balRes = await request(app).get(`/api/v1/inventory/balances?warehouseId=${warehouseId}&materialId=${materialId}`).set(auth()).expect(200);
      expect(balRes.body.data.items[0].quantityOnHand).toBe(107.2);

      // 2. ADJUSTMENT_OUT: subtract 100 units
      const adjOutRes = await request(app)
        .post('/api/v1/inventory/adjustments')
        .set(auth())
        .send({
          transactionCode: `ADJ-OUT-${unique}`,
          transactionType: 'ADJUSTMENT_OUT',
          warehouseId,
          transactionDate: '2026-06-16',
          notes: 'Kiem ke kho giam',
          items: [{ materialId, quantity: 100 }],
        })
        .expect(201);
      expect(adjOutRes.body.data.transactionType).toBe('ADJUSTMENT_OUT');

      // Verify balance (107.2 - 100 = 7.2)
      balRes = await request(app).get(`/api/v1/inventory/balances?warehouseId=${warehouseId}&materialId=${materialId}`).set(auth()).expect(200);
      expect(balRes.body.data.items[0].quantityOnHand).toBe(7.2);
    });
  });
});
