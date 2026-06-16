import { buildPagination, getPagination } from '../../utils/pagination.js';
import { AppError } from '../../utils/app-error.js';
import { warehouseRepository } from './warehouse.repository.js';

const ensureExists = async (id) => {
  const warehouse = await warehouseRepository.findById(id);
  if (!warehouse) {
    throw new AppError('Khong tim thay kho', 404, 'WAREHOUSE_NOT_FOUND');
  }
  return warehouse;
};

const handleDuplicate = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('Ma kho da ton tai', 409, 'WAREHOUSE_CODE_DUPLICATED');
  }
  throw error;
};

export const warehouseService = {
  async list(query) {
    const pagination = getPagination(query);
    const result = await warehouseRepository.findMany({
      ...pagination,
      search: query.search,
      isActive: query.isActive,
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

  async getById(id) {
    return ensureExists(id);
  },

  async getBalances(id, query) {
    await ensureExists(id);
    const pagination = getPagination(query);
    const result = await warehouseRepository.findBalances(id, {
      ...pagination,
      search: query.search,
      category: query.category,
      lowStock: query.lowStock,
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

  async create(payload, userId) {
    try {
      return await warehouseRepository.create({ ...payload, createdBy: userId });
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload) {
    await ensureExists(id);
    try {
      return await warehouseRepository.update(id, payload);
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async deactivate(id) {
    await ensureExists(id);
    return warehouseRepository.deactivate(id);
  },
};
