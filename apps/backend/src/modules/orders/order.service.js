import { customerRepository } from '../customers/customer.repository.js';
import { productRepository } from '../products/product.repository.js';
import { buildPagination, getPagination } from '../../utils/pagination.js';
import { AppError } from '../../utils/app-error.js';
import { ALLOWED_STATUS_TRANSITIONS } from './order.constants.js';
import { orderRepository } from './order.repository.js';

const ensureOrderExists = async (id) => {
  const order = await orderRepository.findById(id);
  if (!order) {
    throw new AppError('Khong tim thay don hang', 404, 'ORDER_NOT_FOUND');
  }
  return order;
};

const ensureCustomerActive = async (customerId) => {
  const customer = await customerRepository.findActiveById(customerId);
  if (!customer) {
    throw new AppError('Khach hang khong ton tai hoac da ngung hoat dong', 400, 'CUSTOMER_INVALID');
  }
};

const ensureProductsActive = async (items) => {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await productRepository.findActiveByIds(productIds);

  if (products.length !== productIds.length) {
    throw new AppError('San pham khong ton tai hoac da ngung hoat dong', 400, 'PRODUCT_INVALID');
  }
};

const handleDuplicate = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('Ma don hang da ton tai', 409, 'ORDER_CODE_DUPLICATED');
  }
  throw error;
};

export const orderService = {
  async list(query) {
    const pagination = getPagination(query);
    const result = await orderRepository.findMany({
      ...pagination,
      ...query,
    });

    return {
      items: result.items,
      pagination: buildPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
      }),
    };
  },

  async getById(id) {
    const order = await orderRepository.findDetail(id);
    if (!order) {
      throw new AppError('Khong tim thay don hang', 404, 'ORDER_NOT_FOUND');
    }
    return order;
  },

  async create(payload, userId) {
    await ensureCustomerActive(payload.customerId);
    await ensureProductsActive(payload.items);

    try {
      const orderId = await orderRepository.create({
        order: payload,
        items: payload.items,
        userId,
      });
      return this.getById(orderId);
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload, userId) {
    const currentOrder = await ensureOrderExists(id);
    if (['DELIVERED', 'CANCELLED'].includes(currentOrder.status)) {
      throw new AppError('Khong the cap nhat don hang da giao hoac da huy', 400, 'ORDER_NOT_EDITABLE');
    }
    if (!['DRAFT', 'CONFIRMED'].includes(currentOrder.status)) {
      throw new AppError('Chi duoc sua don hang o trang thai DRAFT hoac CONFIRMED', 400, 'ORDER_NOT_EDITABLE');
    }
    if (payload.customerId) {
      await ensureCustomerActive(payload.customerId);
    }
    if (payload.items) {
      await ensureProductsActive(payload.items);
    }

    await orderRepository.update({
      orderId: id,
      order: payload,
      items: payload.items,
      userId,
    });
    return this.getById(id);
  },

  async updateStatus(id, { status, changeNote }, userId) {
    const order = await ensureOrderExists(id);
    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[order.status] ?? [];

    if (!allowedNextStatuses.includes(status)) {
      throw new AppError('Chuyen trang thai khong hop le', 400, 'INVALID_STATUS_TRANSITION');
    }

    if (status === 'CANCELLED' && !changeNote) {
      throw new AppError('Can nhap ly do khi huy don hang', 400, 'CANCEL_REASON_REQUIRED');
    }

    await orderRepository.updateStatus({
      orderId: id,
      fromStatus: order.status,
      toStatus: status,
      changeNote,
      userId,
    });

    return this.getById(id);
  },

  async getStatusHistory(id) {
    await ensureOrderExists(id);
    return orderRepository.findStatusHistory(id);
  },

  async summary() {
    return orderRepository.summary();
  },
};
