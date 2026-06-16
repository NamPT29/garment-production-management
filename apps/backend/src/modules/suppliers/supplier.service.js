import { buildPagination, getPagination } from '../../utils/pagination.js';
import { AppError } from '../../utils/app-error.js';
import { supplierRepository } from './supplier.repository.js';

const ensureExists = async (id) => {
  const supplier = await supplierRepository.findById(id);
  if (!supplier) {
    throw new AppError('Khong tim thay nha cung cap', 404, 'SUPPLIER_NOT_FOUND');
  }
  return supplier;
};

const handleDuplicate = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('Ma nha cung cap da ton tai', 409, 'SUPPLIER_CODE_DUPLICATED');
  }
  throw error;
};

export const supplierService = {
  async list(query) {
    const pagination = getPagination(query);
    const result = await supplierRepository.findMany({
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

  async create(payload, userId) {
    try {
      return await supplierRepository.create({ ...payload, createdBy: userId });
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload) {
    await ensureExists(id);
    try {
      return await supplierRepository.update(id, payload);
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async deactivate(id) {
    await ensureExists(id);
    const isUsed = await supplierRepository.isUsedAsDefault(id);
    const supplier = await supplierRepository.deactivate(id);
    
    if (isUsed) {
      return {
        ...supplier,
        warning: 'Nha cung cap nay dang duoc dung lam mac dinh cho nguyen phu lieu dang hoat dong.',
      };
    }
    return supplier;
  },
};
