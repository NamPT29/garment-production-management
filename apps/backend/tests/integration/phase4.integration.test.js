import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import app from '../../src/app.js';
import { disconnectDatabase } from '../../src/config/database.js';

const unique = Date.now();
const adminCredentials = { identifier: 'admin', password: 'Admin@123456' };
let adminToken;
let lineId1, lineId2;
let shiftId1;
let operationId1, operationId2;
let productionOrderId;
let scheduleId;
let customerId;
let productId;
let orderId;

const auth = () => ({ Authorization: `Bearer ${adminToken}` });

describe('phase 4 production APIs', () => {
  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send(adminCredentials)
      .expect(200);
    adminToken = loginResponse.body.data.accessToken;

    // Create unique Customer
    const cusRes = await request(app)
      .post('/api/v1/customers')
      .set(auth())
      .send({
        customerCode: `CUS-P4-${unique}`,
        customerName: 'Customer Phase 4 Test',
      })
      .expect(201);
    customerId = cusRes.body.data.id;

    // Create unique Product
    const prodRes = await request(app)
      .post('/api/v1/products')
      .set(auth())
      .send({
        productCode: `PRO-P4-${unique}`,
        productName: 'Ao thun Phase 4 Test',
        category: 'Ao',
        unit: 'cai',
      })
      .expect(201);
    productId = prodRes.body.data.id;

    // Create unique Order with order item
    const ordRes = await request(app)
      .post('/api/v1/orders')
      .set(auth())
      .send({
        orderCode: `ORD-P4-${unique}`,
        customerId: customerId,
        orderDate: '2026-06-16',
        expectedDeliveryDate: '2026-07-01',
        items: [
          {
            productId: productId,
            quantity: 100,
            unitPrice: 10000,
            color: 'Trang',
            size: 'M',
          },
        ],
      })
      .expect(201);
    orderId = ordRes.body.data.id;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  // 1. PRODUCTION LINES
  describe('Production Lines API', () => {
    it('creates a production line', async () => {
      const response = await request(app)
        .post('/api/v1/production-lines')
        .set(auth())
        .send({
          lineCode: `LINE-${unique}-1`,
          lineName: 'Chuyen may test 1',
          location: 'Khu vuc test',
          targetWorkers: 5,
          maximumWorkers: 10,
          status: 'ACTIVE',
          description: 'Description for line',
        })
        .expect(201);

      lineId1 = response.body.data.id;
      expect(response.body.data.lineCode).toBe(`LINE-${unique}-1`);
    });

    it('rejects duplicate line code', async () => {
      await request(app)
        .post('/api/v1/production-lines')
        .set(auth())
        .send({
          lineCode: `LINE-${unique}-1`,
          lineName: 'Chuyen may test trung ma',
        })
        .expect(409);
    });

    it('updates a production line', async () => {
      const response = await request(app)
        .put(`/api/v1/production-lines/${lineId1}`)
        .set(auth())
        .send({
          lineName: 'Chuyen may test 1 cap nhat',
          targetWorkers: 6,
          maximumWorkers: 12,
          status: 'MAINTENANCE',
          description: 'Description update',
        })
        .expect(200);

      expect(response.body.data.lineName).toBe('Chuyen may test 1 cap nhat');
      expect(response.body.data.maximumWorkers).toBe(12);
    });
  });

  // 2. SHIFTS
  describe('Shifts API', () => {
    it('creates a shift', async () => {
      const response = await request(app)
        .post('/api/v1/shifts')
        .set(auth())
        .send({
          shiftCode: `SHIFT-${unique}-1`,
          shiftName: 'Ca test 1',
          startTime: '08:00:00',
          endTime: '16:00:00',
          breakMinutes: 30,
        })
        .expect(201);

      shiftId1 = response.body.data.id;
      expect(response.body.data.shiftCode).toBe(`SHIFT-${unique}-1`);
    });

    it('rejects shift with same start and end times', async () => {
      await request(app)
        .post('/api/v1/shifts')
        .set(auth())
        .send({
          shiftCode: `SHIFT-${unique}-invalid`,
          shiftName: 'Ca loi',
          startTime: '08:00:00',
          endTime: '08:00:00',
        })
        .expect(400);
    });
  });

  // 3. OPERATIONS
  describe('Operations API', () => {
    it('creates standard operation', async () => {
      const response = await request(app)
        .post('/api/v1/operations')
        .set(auth())
        .send({
          operationCode: `OP-T-${unique}-1`,
          operationName: 'Cat test',
          standardTimeSeconds: 60,
          difficultyLevel: 'MEDIUM',
        })
        .expect(201);

      operationId1 = response.body.data.id;
    });

    it('adds operation flow sequence to product', async () => {
      const response = await request(app)
        .post(`/api/v1/operations/products/${productId}/operations`)
        .set(auth())
        .send({
          operationId: operationId1,
          sequenceNumber: 1,
          standardTimeSeconds: 60,
          requiredSkillLevel: 'BEGINNER',
        })
        .expect(201);

      expect(response.body.data.sequenceNumber).toBe(1);
    });

    it('blocks duplicate product operation sequence number', async () => {
      // Create another op
      const opRes = await request(app)
        .post('/api/v1/operations')
        .set(auth())
        .send({
          operationCode: `OP-T-${unique}-2`,
          operationName: 'May test',
          standardTimeSeconds: 120,
        })
        .expect(201);
      operationId2 = opRes.body.data.id;

      // Add to product with sequence 1 (duplicate)
      await request(app)
        .post(`/api/v1/operations/products/${productId}/operations`)
        .set(auth())
        .send({
          operationId: operationId2,
          sequenceNumber: 1,
          standardTimeSeconds: 120,
        })
        .expect(400);
    });
  });

  // 4. PRODUCTION ORDERS
  describe('Production Orders API', () => {
    it('creates a production order', async () => {
      const response = await request(app)
        .post('/api/v1/production-orders')
        .set(auth())
        .send({
          productionOrderCode: `PO-T-${unique}-1`,
          orderId: orderId,
          productId: productId,
          plannedQuantity: 50,
          plannedStartDate: '2026-06-16',
          plannedEndDate: '2026-06-23',
          priority: 'NORMAL',
          status: 'DRAFT',
        })
        .expect(201);

      productionOrderId = response.body.data.id;
      expect(response.body.data.productionOrderCode).toBe(`PO-T-${unique}-1`);
    });

    it('blocks production order planned quantity exceeding order item quantity', async () => {
      await request(app)
        .post('/api/v1/production-orders')
        .set(auth())
        .send({
          productionOrderCode: `PO-T-${unique}-exceed`,
          orderId: orderId,
          productId: productId,
          plannedQuantity: 60,
          plannedStartDate: '2026-06-16',
          plannedEndDate: '2026-06-23',
        })
        .expect(400);
    });
  });

  // 5. SCHEDULES (trực tiếp, không qua allocation)
  describe('Schedules API', () => {
    it('creates a second production line for conflict test', async () => {
      const lineRes = await request(app)
        .post('/api/v1/production-lines')
        .set(auth())
        .send({
          lineCode: `LINE-${unique}-2`,
          lineName: 'Chuyen may test 2',
          targetWorkers: 5,
          maximumWorkers: 10,
        })
        .expect(201);
      lineId2 = lineRes.body.data.id;
    });

    it('creates schedule directly from production order', async () => {
      const response = await request(app)
        .post('/api/v1/production-plans/schedules')
        .set(auth())
        .send({
          productionOrderId: productionOrderId,
          productionLineId: lineId1,
          shiftId: shiftId1,
          scheduleDate: '2026-06-17',
          allocatedQuantity: 30,
          targetQuantity: 10,
          plannedWorkers: 3,
          plannedStartDate: '2026-06-16',
          plannedEndDate: '2026-06-23',
          status: 'CONFIRMED',
        })
        .expect(201);

      scheduleId = response.body.data.id;
      expect(response.body.data.productionOrderId).toBe(productionOrderId);
    });

    it('blocks allocation exceeding production order planned quantity', async () => {
      // PO has 50 planned. We already allocated 30. Allocating another 25 should exceed 50.
      await request(app)
        .post('/api/v1/production-plans/schedules')
        .set(auth())
        .send({
          productionOrderId: productionOrderId,
          productionLineId: lineId2,
          shiftId: shiftId1,
          scheduleDate: '2026-06-18',
          allocatedQuantity: 25,
          targetQuantity: 10,
          plannedWorkers: 3,
          plannedStartDate: '2026-06-16',
          plannedEndDate: '2026-06-23',
          status: 'CONFIRMED',
        })
        .expect(400);
    });

    it('blocks duplicate line + shift + date schedule', async () => {
      // Same line, same shift, same date as existing schedule
      await request(app)
        .post('/api/v1/production-plans/schedules')
        .set(auth())
        .send({
          productionOrderId: productionOrderId,
          productionLineId: lineId1,
          shiftId: shiftId1,
          scheduleDate: '2026-06-17', // same date as existing
          allocatedQuantity: 10,
          targetQuantity: 5,
          plannedWorkers: 2,
          plannedStartDate: '2026-06-16',
          plannedEndDate: '2026-06-23',
          status: 'CONFIRMED',
        })
        .expect(400);
    });
  });

  // 6. PRODUCTION OUTPUTS & COMPUTED PROGRESS
  describe('Production Outputs & Progress API', () => {
    it('records production output and updates order progress', async () => {
      // Update PO status to PLANNED then RELEASED so outputs can be recorded
      await request(app)
        .patch(`/api/v1/production-orders/${productionOrderId}/status`)
        .set(auth())
        .send({ status: 'PLANNED' })
        .expect(200);

      await request(app)
        .patch(`/api/v1/production-orders/${productionOrderId}/status`)
        .set(auth())
        .send({ status: 'RELEASED' })
        .expect(200);

      const response = await request(app)
        .post('/api/v1/production-outputs')
        .set(auth())
        .send({
          productionScheduleId: scheduleId,
          productionOrderId: productionOrderId,
          productionLineId: lineId1,
          shiftId: shiftId1,
          outputDate: '2026-06-17',
          goodQuantity: 10,
          defectQuantity: 1,
          reworkQuantity: 0,
          workingMinutes: 480,
          downtimeMinutes: 10,
        })
        .expect(201);

      expect(response.body.data.goodQuantity).toBe(10);

      // Verify PO updated completed_quantity
      const poRes = await request(app)
        .get(`/api/v1/production-orders/${productionOrderId}`)
        .set(auth())
        .expect(200);
      expect(poRes.body.data.completedQuantity).toBe(10);
      expect(poRes.body.data.status).toBe('IN_PROGRESS');

      // Verify computed progress dashboard
      const dbRes = await request(app)
        .get('/api/v1/production-progress/dashboard')
        .set(auth())
        .expect(200);
      expect(dbRes.body.data.activeOrders).toBeGreaterThan(0);
    });
  });
});
