import { created, ok } from '../../utils/api-response.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { inventoryService } from './inventory.service.js';

export const listBalances = asyncHandler(async (req, res) => {
  return ok(res, await inventoryService.listBalances(req.validated.query), 'Lay danh sach ton kho thanh cong');
});

export const listTransactions = asyncHandler(async (req, res) => {
  return ok(res, await inventoryService.listTransactions(req.validated.query), 'Lay lich su giao dich kho thanh cong');
});

export const getTransaction = asyncHandler(async (req, res) => {
  return ok(res, await inventoryService.getTransactionById(req.validated.params.id), 'Lay chi tiet phieu kho thanh cong');
});

export const createReceipt = asyncHandler(async (req, res) => {
  return created(
    res,
    await inventoryService.createReceipt(req.validated.body, req.user.id),
    'Tao phieu nhap kho thanh cong',
  );
});

export const createIssue = asyncHandler(async (req, res) => {
  return created(
    res,
    await inventoryService.createIssue(req.validated.body, req.user.id),
    'Tao phieu xuat kho thanh cong',
  );
});

export const createAdjustment = asyncHandler(async (req, res) => {
  return created(
    res,
    await inventoryService.createAdjustment(req.validated.body, req.user.id),
    'Tao phieu dieu chinh kho thanh cong',
  );
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  return ok(res, await inventoryService.getDashboardSummary(), 'Lay tom tat dashboard kho thanh cong');
});
