import { Router } from 'express';
import aiRoutes from '../modules/ai/ai.route.js';
import authRoutes from '../modules/auth/auth.route.js';
import customerRoutes from '../modules/customers/customer.route.js';
import healthRoutes from '../modules/health/health.route.js';
import orderRoutes from '../modules/orders/order.route.js';
import productRoutes from '../modules/products/product.route.js';

// Phase 3 Routers
import supplierRoutes from '../modules/suppliers/supplier.route.js';
import materialRoutes from '../modules/materials/material.route.js';
import warehouseRoutes from '../modules/warehouses/warehouse.route.js';
import bomRoutes from '../modules/boms/bom.route.js';
import inventoryRoutes from '../modules/inventory/inventory.route.js';

// Phase 4 Routers
import productionLineRoutes from '../modules/production-lines/production-line.route.js';
import employeeRoutes from '../modules/employees/employee.route.js';
import shiftRoutes from '../modules/shifts/shift.route.js';
import operationRoutes from '../modules/operations/operation.route.js';
import productionOrderRoutes from '../modules/production-orders/production-order.route.js';
import productionPlanRoutes from '../modules/production-plans/production-plan.route.js';
import productionOutputRoutes from '../modules/production-outputs/production-output.route.js';
import productionProgressRoutes from '../modules/production-progress/production-progress.route.js';

const router = Router();

router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/health', healthRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);

// Phase 3 Mounts
router.use('/suppliers', supplierRoutes);
router.use('/materials', materialRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/boms', bomRoutes);
router.use('/inventory', inventoryRoutes);

// Phase 4 Mounts
router.use('/production-lines', productionLineRoutes);
router.use('/employees', employeeRoutes);
router.use('/shifts', shiftRoutes);
router.use('/operations', operationRoutes);
router.use('/production-orders', productionOrderRoutes);
router.use('/production-plans', productionPlanRoutes);
router.use('/production-outputs', productionOutputRoutes);
router.use('/production-progress', productionProgressRoutes);

export default router;
