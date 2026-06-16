import { Router } from 'express';
import aiRoutes from '../modules/ai/ai.route.js';
import authRoutes from '../modules/auth/auth.route.js';
import customerRoutes from '../modules/customers/customer.route.js';
import healthRoutes from '../modules/health/health.route.js';
import orderRoutes from '../modules/orders/order.route.js';
import productRoutes from '../modules/products/product.route.js';

const router = Router();

router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/health', healthRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);

export default router;
