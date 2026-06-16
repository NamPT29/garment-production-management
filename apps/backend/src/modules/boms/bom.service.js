import { buildPagination, getPagination } from '../../utils/pagination.js';
import { AppError } from '../../utils/app-error.js';
import { bomRepository } from './bom.repository.js';
import { productRepository } from '../products/product.repository.js';
import { materialRepository } from '../materials/material.repository.js';

const ensureExists = async (id) => {
  const bom = await bomRepository.findById(id);
  if (!bom) {
    throw new AppError('Khong tim thay BOM', 404, 'BOM_NOT_FOUND');
  }
  return bom;
};

const ensureProductActive = async (productId) => {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new AppError('San pham khong ton tai', 400, 'PRODUCT_NOT_FOUND');
  }
  if (!product.isActive) {
    throw new AppError('San pham da ngung hoat dong', 400, 'PRODUCT_INACTIVE');
  }
};

const ensureMaterialsActive = async (items) => {
  const materialIds = [...new Set(items.map((item) => item.materialId))];
  const activeMaterials = await materialRepository.findActiveByIds(materialIds);
  if (activeMaterials.length !== materialIds.length) {
    throw new AppError('Mot so nguyen phu lieu khong ton tai hoac da ngung hoat dong', 400, 'MATERIAL_INVALID');
  }
};

const ensureVersionUnique = async (productId, version, excludeBomId = null) => {
  const existing = await bomRepository.findByProductAndVersion(productId, version);
  if (existing && Number(existing.id) !== Number(excludeBomId)) {
    throw new AppError('Phien ban cua san pham nay da ton tai', 409, 'BOM_VERSION_DUPLICATED');
  }
};

export const bomService = {
  async list(query) {
    const pagination = getPagination(query);
    const result = await bomRepository.findMany({
      ...pagination,
      search: query.search,
      productId: query.productId,
      status: query.status,
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

  async getByProductId(productId) {
    return bomRepository.findManyByProductId(productId);
  },

  async getActiveByProductId(productId) {
    const bom = await bomRepository.findActiveByProductId(productId);
    if (!bom) {
      throw new AppError('San pham chua co BOM ACTIVE', 404, 'BOM_ACTIVE_NOT_FOUND');
    }
    return bom;
  },

  async create(payload, userId) {
    await ensureProductActive(payload.productId);
    await ensureVersionUnique(payload.productId, payload.version);
    await ensureMaterialsActive(payload.items);

    const bomId = await bomRepository.create({
      bom: payload,
      items: payload.items,
      userId,
    });
    return this.getById(bomId);
  },

  async update(id, payload, userId) {
    const bom = await ensureExists(id);
    if (bom.status !== 'DRAFT') {
      throw new AppError('Chi duoc sua BOM dang o trang thai DRAFT', 400, 'BOM_NOT_EDITABLE');
    }

    if (payload.version) {
      await ensureVersionUnique(bom.productId, payload.version, id);
    }
    if (payload.items) {
      await ensureMaterialsActive(payload.items);
    }

    await bomRepository.update({
      bomId: id,
      bom: payload,
      items: payload.items,
      userId,
    });
    return this.getById(id);
  },

  async activate(id) {
    await ensureExists(id);
    await bomRepository.activate(id);
    return this.getById(id);
  },

  async deactivate(id) {
    const bom = await ensureExists(id);
    if (bom.status === 'ACTIVE') {
      throw new AppError('Khong the truc tiep deactive BOM dang ACTIVE. Vui long activate mot BOM khac hoac lien he admin.', 400, 'BOM_ACTIVE_NOT_DEACTIVATABLE');
    }
    await bomRepository.deactivate(id);
    return this.getById(id);
  },
};
