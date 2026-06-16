import { buildPagination, getPagination } from '../../utils/pagination.js';
import { AppError } from '../../utils/app-error.js';
import { customerRepository } from './customer.repository.js';

const ensureExists = async (id) => {
  const customer = await customerRepository.findById(id);
  if (!customer) {
    throw new AppError('Khong tim thay khach hang', 404, 'CUSTOMER_NOT_FOUND');
  }
  return customer;
};

const handleDuplicate = (error) => {
  if (error.code === 'ER_DUP_ENTRY') {
    throw new AppError('Ma khach hang da ton tai', 409, 'CUSTOMER_CODE_DUPLICATED');
  }
  throw error;
};

export const customerService = {
  async list(query) {
    const pagination = getPagination(query);
    const result = await customerRepository.findMany({
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
      return await customerRepository.create({ ...payload, createdBy: userId });
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async update(id, payload) {
    await ensureExists(id);
    try {
      return await customerRepository.update(id, payload);
    } catch (error) {
      handleDuplicate(error);
    }
  },

  async deactivate(id) {
    await ensureExists(id);
    return customerRepository.deactivate(id);
  },
};
