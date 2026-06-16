import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware.js';
import { authorizePermissions } from '../../middlewares/authorize.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createAdjustment,
  createIssue,
  createReceipt,
  getDashboardSummary,
  getTransaction,
  listBalances,
  listTransactions,
} from './inventory.controller.js';
import {
  createAdjustmentSchema,
  createIssueSchema,
  createReceiptSchema,
  listBalancesSchema,
  listTransactionsSchema,
  transactionIdSchema,
} from './inventory.validation.js';

const router = Router();

router.use(authenticate);

router.get('/balances', authorizePermissions('INVENTORY_VIEW'), validate(listBalancesSchema), listBalances);
router.get('/dashboard-summary', authorizePermissions('INVENTORY_VIEW'), getDashboardSummary);
router.get('/transactions', authorizePermissions('INVENTORY_TRANSACTION_VIEW'), validate(listTransactionsSchema), listTransactions);
router.get('/transactions/:id', authorizePermissions('INVENTORY_TRANSACTION_VIEW'), validate(transactionIdSchema), getTransaction);

router.post('/receipts', authorizePermissions('INVENTORY_RECEIPT'), validate(createReceiptSchema), createReceipt);
router.post('/issues', authorizePermissions('INVENTORY_ISSUE'), validate(createIssueSchema), createIssue);
router.post('/adjustments', authorizePermissions('INVENTORY_ADJUST'), validate(createAdjustmentSchema), createAdjustment);

export default router;
