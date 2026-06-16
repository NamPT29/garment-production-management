import { AppError } from '../../utils/app-error.js';
import { operationRepository } from './operation.repository.js';
import { productRepository } from '../products/product.repository.js';

const ensureOperationExists = async (operationId) => {
  const op = await operationRepository.findById(operationId);
  if (!op) {
    throw new AppError('Công đoạn không tồn tại', 400, 'OPERATION_NOT_FOUND');
  }
  return op;
};

const ensureProductExists = async (productId) => {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new AppError('Sản phẩm không tồn tại', 404, 'PRODUCT_NOT_FOUND');
  }
  return product;
};

export const operationService = {
  async list(filters) {
    return operationRepository.findAll(filters);
  },

  async getDetail(id) {
    const op = await operationRepository.findById(id);
    if (!op) {
      throw new AppError('Công đoạn không tồn tại', 404, 'OPERATION_NOT_FOUND');
    }
    return op;
  },

  async create(payload, userId) {
    const existing = await operationRepository.findByCode(payload.operationCode);
    if (existing) {
      throw new AppError('Mã công đoạn đã tồn tại', 409, 'OPERATION_CODE_DUPLICATED');
    }
    const id = await operationRepository.create(payload, userId);
    return this.getDetail(id);
  },

  async update(id, payload) {
    await this.getDetail(id);
    return operationRepository.update(id, payload);
  },

  // Product Operations flow
  async getProductOperations(productId) {
    await ensureProductExists(productId);
    return operationRepository.findProductOperations(productId);
  },

  async addProductOperation(productId, payload) {
    await ensureProductExists(productId);
    await ensureOperationExists(payload.operationId);

    // Check unique sequence
    const seqExists = await operationRepository.checkProductSequenceExists(productId, payload.sequenceNumber);
    if (seqExists) {
      throw new AppError('Thứ tự công đoạn này đã tồn tại trong quy trình sản phẩm', 400, 'PRODUCT_SEQUENCE_DUPLICATED');
    }

    // Check unique operation for product
    const opExists = await operationRepository.checkProductOperationExists(productId, payload.operationId);
    if (opExists) {
      throw new AppError('Công đoạn này đã có trong quy trình sản phẩm', 400, 'PRODUCT_OPERATION_DUPLICATED');
    }

    const id = await operationRepository.addProductOperation({
      ...payload,
      productId,
    });
    return operationRepository.findProductOperationById(id);
  },

  async updateProductOperation(productId, productOpId, payload) {
    await ensureProductExists(productId);
    const existing = await operationRepository.findProductOperationById(productOpId);
    if (!existing || existing.productId !== Number(productId)) {
      throw new AppError('Công đoạn sản phẩm không tồn tại hoặc không khớp sản phẩm', 404, 'PRODUCT_OPERATION_NOT_FOUND');
    }

    // Check unique sequence if sequence is changed
    if (existing.sequenceNumber !== payload.sequenceNumber) {
      const seqExists = await operationRepository.checkProductSequenceExists(productId, payload.sequenceNumber);
      if (seqExists) {
        throw new AppError('Thứ tự công đoạn này đã tồn tại trong quy trình sản phẩm', 400, 'PRODUCT_SEQUENCE_DUPLICATED');
      }
    }

    return operationRepository.updateProductOperation(productOpId, payload);
  },

  async removeProductOperation(productId, productOpId) {
    await ensureProductExists(productId);
    const existing = await operationRepository.findProductOperationById(productOpId);
    if (!existing || existing.productId !== Number(productId)) {
      throw new AppError('Công đoạn sản phẩm không tồn tại hoặc không khớp sản phẩm', 404, 'PRODUCT_OPERATION_NOT_FOUND');
    }

    await operationRepository.removeProductOperation(productOpId);
    return { success: true };
  },
};
