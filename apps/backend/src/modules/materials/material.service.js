import { buildPagination, getPagination } from '../../utils/pagination.js';
import { AppError } from '../../utils/app-error.js';
import { materialRepository } from './material.repository.js';
import { supplierRepository } from '../suppliers/supplier.repository.js';

const ensureExists = async (id) => {
  const material = await materialRepository.findById(id);
  if (!material) {
    throw new AppError('Khong tim thay nguyen phu lieu', 404, 'MATERIAL_NOT_FOUND');
  }
  return material;
};

const ensureSupplierActive = async (supplierId) => {
  if (supplierId) {
    const supplier = await supplierRepository.findActiveById(supplierId);
    if (!supplier) {
      throw new AppError('Nha cung cap khong ton tai hoac da ngung hoat dong', 400, 'SUPPLIER_INVALID');
    }
  }
};

const handleDuplicate = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('Ma nguyen phu lieu da ton tai', 409, 'MATERIAL_CODE_DUPLICATED');
  }
  throw error;
};

export const materialService = {
  async list(query) {
    const pagination = getPagination(query);
    const result = await materialRepository.findMany({
      ...pagination,
      search: query.search,
      category: query.category,
      supplierId: query.supplierId,
      isActive: query.isActive,
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

  async getById(id) {
    return ensureExists(id);
  },

  async create(payload, userId) {
    await ensureSupplierActive(payload.defaultSupplierId);
    try {
      return await materialRepository.create({ ...payload, createdBy: userId });
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload) {
    await ensureExists(id);
    if (payload.defaultSupplierId) {
      await ensureSupplierActive(payload.defaultSupplierId);
    }
    try {
      return await materialRepository.update(id, payload);
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async deactivate(id) {
    await ensureExists(id);
    return materialRepository.deactivate(id);
  },
};
