import { AppError } from '../../utils/app-error.js';
import { productionOrderRepository } from './production-order.repository.js';
import { productRepository } from '../products/product.repository.js';
import { orderRepository } from '../orders/order.repository.js';

const checkQuantityRestrictions = async (orderId, productId, plannedQuantity, excludePoId = 0) => {
  // 1. Get total quantity ordered for this product
  const orderedQty = await productionOrderRepository.getParentOrderItemQty(orderId, productId);
  if (orderedQty === 0) {
    throw new AppError('Sản phẩm không thuộc đơn hàng này', 400, 'PRODUCT_NOT_IN_ORDER');
  }

  // 2. Get total planned quantity of other production orders
  const otherPlanned = await productionOrderRepository.getSumOfOtherPlannedQuantities(orderId, productId, excludePoId);
  const remaining = orderedQty - otherPlanned;

  if (plannedQuantity > remaining) {
    throw new AppError(
      `Số lượng sản xuất vượt quá số lượng còn lại của đơn hàng (Còn lại: ${remaining})`,
      400,
      'PLANNED_QTY_EXCEEDS_REMAINING'
    );
  }
};

export const productionOrderService = {
  async list(filters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;
    return productionOrderRepository.findMany({ ...filters, page, limit, skip });
  },

  async getDetail(id) {
    const po = await productionOrderRepository.findById(id);
    if (!po) {
      throw new AppError('Lệnh sản xuất không tồn tại', 404, 'PRODUCTION_ORDER_NOT_FOUND');
    }
    return po;
  },

  async create(payload, userId) {
    // Check code uniqueness
    const existing = await productionOrderRepository.findByCode(payload.productionOrderCode);
    if (existing) {
      throw new AppError('Mã lệnh sản xuất đã tồn tại', 409, 'PRODUCTION_ORDER_CODE_DUPLICATED');
    }

    // Check order and product existence
    const order = await orderRepository.findById(payload.orderId);
    if (!order) {
      throw new AppError('Đơn hàng không tồn tại', 400, 'ORDER_NOT_FOUND');
    }

    const product = await productRepository.findById(payload.productId);
    if (!product) {
      throw new AppError('Sản phẩm không tồn tại', 400, 'PRODUCT_NOT_FOUND');
    }

    // Check quantity constraints
    await checkQuantityRestrictions(payload.orderId, payload.productId, payload.plannedQuantity);

    const id = await productionOrderRepository.create(payload, userId);
    return this.getDetail(id);
  },

  async update(id, payload, userId) {
    const existingPo = await this.getDetail(id);
    if (existingPo.status === 'COMPLETED' || existingPo.status === 'CANCELLED') {
      throw new AppError('Không thể chỉnh sửa lệnh sản xuất đã hoàn thành hoặc hủy', 400, 'PRODUCTION_ORDER_IMMUTABLE');
    }

    // Check quantity constraints
    await checkQuantityRestrictions(existingPo.orderId, existingPo.productId, payload.plannedQuantity, id);

    return productionOrderRepository.update(id, payload, userId);
  },

  async updateStatus(id, status, userId) {
    const existingPo = await this.getDetail(id);
    
    // Define allowed transitions
    // DRAFT -> PLANNED -> RELEASED -> IN_PROGRESS -> COMPLETED/PAUSED/CANCELLED
    const allowedTransitions = {
      DRAFT: ['PLANNED', 'CANCELLED'],
      PLANNED: ['DRAFT', 'RELEASED', 'CANCELLED'],
      RELEASED: ['PLANNED', 'IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['IN_PROGRESS', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const currentStatus = existingPo.status;
    if (currentStatus !== status && !allowedTransitions[currentStatus].includes(status)) {
      throw new AppError(
        `Không thể chuyển trạng thái từ ${currentStatus} sang ${status}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    return productionOrderRepository.updateStatus(id, status, userId);
  },
};
