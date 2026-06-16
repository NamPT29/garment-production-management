import { buildPagination, getPagination } from '../../utils/pagination.js';
import { AppError } from '../../utils/app-error.js';
import { productRepository } from './product.repository.js';

const ensureExists = async (id) => {
  const product = await productRepository.findById(id);
  if (!product) {
    throw new AppError('Khong tim thay san pham', 404, 'PRODUCT_NOT_FOUND');
  }
  return product;
};

const handleDuplicate = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('Ma san pham da ton tai', 409, 'PRODUCT_CODE_DUPLICATED');
  }
  throw error;
};

export const productService = {
  async list(query) {
    const pagination = getPagination(query);
    const result = await productRepository.findMany({
      ...pagination,
      search: query.search,
      category: query.category,
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
      return await productRepository.create({ ...payload, createdBy: userId });
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload) {
    await ensureExists(id);
    try {
      return await productRepository.update(id, payload);
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async deactivate(id) {
    await ensureExists(id);
    return productRepository.deactivate(id);
  },
};
