import { AppError } from '../../utils/app-error.js';
import { orderRepository } from '../orders/order.repository.js';
import { bomRepository } from '../boms/bom.repository.js';
import { query } from '../../config/database.js';

export const materialRequirementService = {
  async calculateRequirements(orderId) {
    const order = await orderRepository.findDetail(orderId);
    if (!order) {
      throw new AppError('Khong tim thay don hang', 404, 'ORDER_NOT_FOUND');
    }

    const requirementsMap = {};
    const warnings = [];
    const productsMissingBom = [];

    for (const item of order.items) {
      const activeBom = await bomRepository.findActiveByProductId(item.productId);
      if (!activeBom) {
        warnings.push(`Ao/Quan "${item.product.productName}" (Ma: ${item.product.productCode}) chua co BOM ACTIVE`);
        productsMissingBom.push({
          id: item.productId,
          productCode: item.product.productCode,
          productName: item.product.productName,
        });
        continue;
      }

      for (const bomItem of activeBom.items) {
        const matId = bomItem.materialId;
        const wasteCoeff = 1 + Number(bomItem.wasteRatePercent ?? 0) / 100;
        const needed = Number(item.quantity) * Number(bomItem.quantityPerUnit) * wasteCoeff;

        if (!requirementsMap[matId]) {
          requirementsMap[matId] = {
            materialId: matId,
            materialCode: bomItem.material.materialCode,
            materialName: bomItem.material.materialName,
            unit: bomItem.material.unit,
            requiredQuantity: 0,
            bomDetails: [],
          };
        }

        requirementsMap[matId].requiredQuantity += needed;
        requirementsMap[matId].bomDetails.push({
          productId: item.productId,
          productCode: item.product.productCode,
          productName: item.product.productName,
          orderQuantity: item.quantity,
          quantityPerUnit: bomItem.quantityPerUnit,
          wasteRatePercent: bomItem.wasteRatePercent,
          calculatedNeed: needed,
        });
      }
    }

    const materialIds = Object.keys(requirementsMap).map(Number);
    let stockMap = {};

    if (materialIds.length > 0) {
      const placeholders = materialIds.map(() => '?').join(', ');
      const stockRows = await query(
        `
          SELECT iti.material_id, SUM(
            CASE
              WHEN it.transaction_type IN ('RECEIPT', 'ADJUSTMENT_IN') THEN iti.quantity
              WHEN it.transaction_type IN ('ISSUE', 'ADJUSTMENT_OUT') THEN -iti.quantity
              ELSE 0
            END
          ) AS total_stock
          FROM inventory_transactions it
          INNER JOIN inventory_transaction_items iti ON iti.inventory_transaction_id = it.id
          WHERE it.status = 'POSTED' AND iti.material_id IN (${placeholders})
          GROUP BY iti.material_id
        `,
        materialIds,
      );
      stockMap = Object.fromEntries(stockRows.map((row) => [row.material_id, Number(row.total_stock ?? 0)]));
    }

    const requirements = Object.values(requirementsMap).map((req) => {
      const available = stockMap[req.materialId] ?? 0;
      const shortage = Math.max(req.requiredQuantity - available, 0);
      return {
        ...req,
        requiredQuantity: Number(req.requiredQuantity.toFixed(4)),
        availableQuantity: Number(available.toFixed(4)),
        shortageQuantity: Number(shortage.toFixed(4)),
        isShortage: shortage > 0,
      };
    });

    return {
      order: {
        id: order.id,
        orderCode: order.orderCode,
        customerName: order.customer?.customerName,
      },
      requirements,
      warnings,
      productsMissingBom,
    };
  },
};
