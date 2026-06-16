import { buildPagination, getPagination } from '../../utils/pagination.js';
import { AppError } from '../../utils/app-error.js';
import { inventoryRepository } from './inventory.repository.js';
import { warehouseRepository } from '../warehouses/warehouse.repository.js';
import { supplierRepository } from '../suppliers/supplier.repository.js';
import { materialRepository } from '../materials/material.repository.js';
import { orderRepository } from '../orders/order.repository.js';

const ensureTransactionCodeUnique = async (code) => {
  const existing = await inventoryRepository.findByTransactionCode(code);
  if (existing) {
    throw new AppError('Ma phieu kho da ton tai', 409, 'TRANSACTION_CODE_DUPLICATED');
  }
};

const ensureWarehouseActive = async (warehouseId) => {
  const warehouse = await warehouseRepository.findById(warehouseId);
  if (!warehouse) {
    throw new AppError('Kho khong ton tai', 400, 'WAREHOUSE_NOT_FOUND');
  }
  if (!warehouse.isActive) {
    throw new AppError('Kho da ngung hoat dong', 400, 'WAREHOUSE_INACTIVE');
  }
};

const ensureSupplierActive = async (supplierId) => {
  if (supplierId) {
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) {
      throw new AppError('Nha cung cap khong ton tai', 400, 'SUPPLIER_NOT_FOUND');
    }
    if (!supplier.isActive) {
      throw new AppError('Nha cung cap da ngung hoat dong', 400, 'SUPPLIER_INACTIVE');
    }
  }
};

const ensureOrderExists = async (orderId) => {
  if (orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Don hang khong ton tai', 400, 'ORDER_NOT_FOUND');
    }
  }
};

const ensureMaterialsActive = async (items) => {
  const materialIds = [...new Set(items.map((item) => item.materialId))];
  const activeMaterials = await materialRepository.findActiveByIds(materialIds);
  if (activeMaterials.length !== materialIds.length) {
    throw new AppError('Mot so nguyen phu lieu khong ton tai hoac da ngung hoat dong', 400, 'MATERIAL_INVALID');
  }
};

const handleInventoryError = (error) => {
  if (error.message && error.message.startsWith('INSUFFICIENT_STOCK_FOR:')) {
    const code = error.message.split(':')[1];
    throw new AppError(`Nguyen phu lieu ${code} khong du ton kho de xuat`, 400, 'INSUFFICIENT_STOCK', [{ materialCode: code }]);
  }
  throw error;
};

export const inventoryService = {
  async listBalances(query) {
    const pagination = getPagination(query);
    const result = await inventoryRepository.findBalances({
      ...pagination,
      search: query.search,
      warehouseId: query.warehouseId,
      materialId: query.materialId,
      category: query.category,
      lowStock: query.lowStock,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
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

  async listTransactions(query) {
    const pagination = getPagination(query);
    const result = await inventoryRepository.findTransactions({
      ...pagination,
      transactionType: query.transactionType,
      warehouseId: query.warehouseId,
      supplierId: query.supplierId,
      orderId: query.orderId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
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

  async getTransactionById(id) {
    const tx = await inventoryRepository.findTransactionById(id);
    if (!tx) {
      throw new AppError('Khong tim thay phieu kho', 404, 'TRANSACTION_NOT_FOUND');
    }
    return tx;
  },

  async createReceipt(payload, userId) {
    await ensureTransactionCodeUnique(payload.transactionCode);
    await ensureWarehouseActive(payload.warehouseId);
    await ensureSupplierActive(payload.supplierId);
    await ensureMaterialsActive(payload.items);

    const txId = await inventoryRepository.createTransaction({
      transactionHeader: {
        ...payload,
        transactionType: 'RECEIPT',
        status: 'POSTED',
      },
      items: payload.items,
      userId,
    });

    return this.getTransactionById(txId);
  },

  async createIssue(payload, userId) {
    await ensureTransactionCodeUnique(payload.transactionCode);
    await ensureWarehouseActive(payload.warehouseId);
    await ensureOrderExists(payload.orderId);
    await ensureMaterialsActive(payload.items);

    try {
      const txId = await inventoryRepository.createTransaction({
        transactionHeader: {
          ...payload,
          transactionType: 'ISSUE',
          status: 'POSTED',
        },
        items: payload.items,
        userId,
      });

      return this.getTransactionById(txId);
    } catch (error) {
      handleInventoryError(error);
    }
  },

  async createAdjustment(payload, userId) {
    await ensureTransactionCodeUnique(payload.transactionCode);
    await ensureWarehouseActive(payload.warehouseId);
    await ensureMaterialsActive(payload.items);

    try {
      const txId = await inventoryRepository.createTransaction({
        transactionHeader: {
          ...payload,
          status: 'POSTED',
        },
        items: payload.items,
        userId,
      });

      return this.getTransactionById(txId);
    } catch (error) {
      handleInventoryError(error);
    }
  },

  async getDashboardSummary() {
    return inventoryRepository.getDashboardSummary();
  },
};
