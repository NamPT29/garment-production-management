import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import app from '../../src/app.js';
import { disconnectDatabase, query } from '../../src/config/database.js';

const unique = Date.now();
const adminCredentials = { identifier: 'admin', password: 'Admin@123456' };
let adminToken;
let customerId;
let productId;
let secondProductId;
let inactiveProductId;
let orderId;

const auth = () => ({ Authorization: `Bearer ${adminToken}` });

describe('phase 2 business APIs', () => {
  beforeAll(async () => {
    const loginResponse = await request(app).post('/api/v1/auth/login').send(adminCredentials).expect(200);
    adminToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('creates a valid customer', async () => {
    const response = await request(app)
      .post('/api/v1/customers')
      .set(auth())
      .send({
        customerCode: `CUS-T-${unique}`,
        customerName: 'Khach hang test',
        contactPerson: 'Tester',
        phone: '0900111222',
        email: `customer-${unique}@example.com`,
      })
      .expect(201);

    customerId = response.body.data.id;
    expect(response.body.data.customerCode).toBe(`CUS-T-${unique}`);
  });

  it('rejects duplicate customer_code', async () => {
    const response = await request(app)
      .post('/api/v1/customers')
      .set(auth())
      .send({
        customerCode: `CUS-T-${unique}`,
        customerName: 'Khach hang trung ma',
      })
      .expect(409);

    expect(response.body.errorCode).toBe('CUSTOMER_CODE_DUPLICATED');
  });

  it('rejects customer API without JWT', async () => {
    await request(app).get('/api/v1/customers').expect(401);
  });

  it('rejects customer create without permission', async () => {
    const ownerRoleRows = await query('SELECT id FROM roles WHERE code = ?', ['OWNER']);
    const passwordHash = await bcrypt.hash('Owner@123456', 10);
    const username = `owner_${unique}`;
    const email = `owner-${unique}@example.com`;
    const result = await query(
      `
        INSERT INTO users (username, email, full_name, password_hash, role_id)
        VALUES (?, ?, ?, ?, ?)
      `,
      [username, email, 'Owner Test', passwordHash, ownerRoleRows[0].id],
    );
    const ownerToken = jwt.sign({ userId: result.insertId, username }, 'change_me_in_real_environment');

    await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ customerCode: `CUS-NO-PERM-${unique}`, customerName: 'No permission' })
      .expect(403);
  });

  it('updates customer and deactivates customer', async () => {
    const updateResponse = await request(app)
      .patch(`/api/v1/customers/${customerId}`)
      .set(auth())
      .send({ phone: '0900999888' })
      .expect(200);
    expect(updateResponse.body.data.phone).toBe('0900999888');

    const response = await request(app)
      .post('/api/v1/customers')
      .set(auth())
      .send({
        customerCode: `CUS-INACTIVE-${unique}`,
        customerName: 'Khach hang ngung hoat dong',
      })
      .expect(201);

    const deactivateResponse = await request(app)
      .patch(`/api/v1/customers/${response.body.data.id}/deactivate`)
      .set(auth())
      .expect(200);
    expect(deactivateResponse.body.data.isActive).toBe(false);
  });

  it('creates valid products and rejects duplicate product_code', async () => {
    const first = await request(app)
      .post('/api/v1/products')
      .set(auth())
      .send({
        productCode: `PRO-T-${unique}-1`,
        productName: 'Ao test',
        category: 'Ao',
        unit: 'cai',
        standardTimeMinutes: 30,
      })
      .expect(201);
    productId = first.body.data.id;

    const second = await request(app)
      .post('/api/v1/products')
      .set(auth())
      .send({
        productCode: `PRO-T-${unique}-2`,
        productName: 'Quan test',
        category: 'Quan',
        unit: 'cai',
      })
      .expect(201);
    secondProductId = second.body.data.id;

    const duplicate = await request(app)
      .post('/api/v1/products')
      .set(auth())
      .send({ productCode: `PRO-T-${unique}-1`, productName: 'Trung ma' })
      .expect(409);
    expect(duplicate.body.errorCode).toBe('PRODUCT_CODE_DUPLICATED');
  });

  it('updates product and deactivates product', async () => {
    const updateResponse = await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set(auth())
      .send({ category: 'Ao cao cap' })
      .expect(200);
    expect(updateResponse.body.data.category).toBe('Ao cao cap');

    const inactive = await request(app)
      .post('/api/v1/products')
      .set(auth())
      .send({ productCode: `PRO-INACTIVE-${unique}`, productName: 'San pham inactive' })
      .expect(201);
    inactiveProductId = inactive.body.data.id;

    const deactivateResponse = await request(app)
      .patch(`/api/v1/products/${inactiveProductId}/deactivate`)
      .set(auth())
      .expect(200);
    expect(deactivateResponse.body.data.isActive).toBe(false);
  });

  it('rejects invalid order inputs', async () => {
    await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-NO-ITEM-${unique}`,
        customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-06-20',
        items: [],
      })
      .expect(400);

    await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-QTY-${unique}`,
        customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-06-20',
        items: [{ productId, quantity: 0, unitPrice: 1 }],
      })
      .expect(400);

    await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-DATE-${unique}`,
        customerId,
        orderDate: '2026-06-20',
        expectedDeliveryDate: '2026-06-16',
        items: [{ productId, quantity: 1, unitPrice: 1 }],
      })
      .expect(400);
  });

  it('rejects order with missing customer/product or inactive product and rolls back', async () => {
    await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-NO-CUSTOMER-${unique}`,
        customerId: 99999999,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-06-20',
        items: [{ productId, quantity: 1, unitPrice: 1 }],
      })
      .expect(400);

    await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-NO-PRODUCT-${unique}`,
        customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-06-20',
        items: [{ productId: 99999999, quantity: 1, unitPrice: 1 }],
      })
      .expect(400);

    await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-INACTIVE-PRODUCT-${unique}`,
        customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-06-20',
        items: [{ productId: inactiveProductId, quantity: 1, unitPrice: 1 }],
      })
      .expect(400);

    const rows = await query('SELECT id FROM orders WHERE order_code = ?', [
      `ORD-INACTIVE-PRODUCT-${unique}`,
    ]);
    expect(rows.length).toBe(0);
  });

  it('creates an order with multiple products', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-T-${unique}`,
        customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-07-01',
        priority: 'HIGH',
        notes: 'Don hang test',
        items: [
          { productId, quantity: 10, unitPrice: 1000, color: 'Trang', size: 'M' },
          { productId: secondProductId, quantity: 5, unitPrice: 2000, color: 'Den', size: 'L' },
        ],
      })
      .expect(201);

    orderId = response.body.data.id;
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.statusHistory).toHaveLength(1);
  });

  it('rejects duplicate order_code', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-T-${unique}`,
        customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-07-01',
        items: [{ productId, quantity: 1, unitPrice: 1000 }],
      })
      .expect(409);

    expect(response.body.errorCode).toBe('ORDER_CODE_DUPLICATED');
  });

  it('lists, gets detail and updates order', async () => {
    const list = await request(app).get('/api/v1/orders?page=1&limit=10').set(auth()).expect(200);
    expect(list.body.data.items.length).toBeGreaterThan(0);

    const detail = await request(app).get(`/api/v1/orders/${orderId}`).set(auth()).expect(200);
    expect(detail.body.data.items).toHaveLength(2);

    const update = await request(app)
      .patch(`/api/v1/orders/${orderId}`)
      .set(auth())
      .send({
        notes: 'Da cap nhat',
        items: [{ productId, quantity: 12, unitPrice: 1500, color: 'Xanh', size: 'XL' }],
      })
      .expect(200);
    expect(update.body.data.items).toHaveLength(1);
  });

  it('updates status with valid and invalid transitions', async () => {
    const confirmed = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth())
      .send({ status: 'CONFIRMED', changeNote: 'Xac nhan don hang' })
      .expect(200);
    expect(confirmed.body.data.status).toBe('CONFIRMED');

    const invalid = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set(auth())
      .send({ status: 'COMPLETED', changeNote: 'Nhanh qua' })
      .expect(400);
    expect(invalid.body.errorCode).toBe('INVALID_STATUS_TRANSITION');

    const history = await request(app)
      .get(`/api/v1/orders/${orderId}/status-history`)
      .set(auth())
      .expect(200);
    expect(history.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('requires reason when cancelling order', async () => {
    const order = await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-CANCEL-${unique}`,
        customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-07-01',
        items: [{ productId, quantity: 1, unitPrice: 1000 }],
      })
      .expect(201);

    const response = await request(app)
      .patch(`/api/v1/orders/${order.body.data.id}/status`)
      .set(auth())
      .send({ status: 'CANCELLED' })
      .expect(400);

    expect(response.body.errorCode).toBe('CANCEL_REASON_REQUIRED');
  });

  it('rejects order create without permission', async () => {
    const ownerRoleRows = await query('SELECT id FROM roles WHERE code = ?', ['OWNER']);
    const passwordHash = await bcrypt.hash('Owner@123456', 10);
    const username = `owner_order_${unique}`;
    const email = `owner-order-${unique}@example.com`;
    const result = await query(
      `
        INSERT INTO users (username, email, full_name, password_hash, role_id)
        VALUES (?, ?, ?, ?, ?)
      `,
      [username, email, 'Owner Order Test', passwordHash, ownerRoleRows[0].id],
    );
    const ownerToken = jwt.sign({ userId: result.insertId, username }, 'change_me_in_real_environment');

    await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        orderCode: `ORD-NO-PERM-${unique}`,
        customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-07-01',
        items: [{ productId, quantity: 1, unitPrice: 1000 }],
      })
      .expect(403);
  });
});
