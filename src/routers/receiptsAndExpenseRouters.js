const { Router } = require('express');
const {
  getReceiptsAndExpense,
  getReceiptsAndExpenseByMonth,
  getExpenseByID,
  getReceiptsByID,
  createReceipts,
  updateRevenue,
  createExpense,
  updateExpense,
  deleteReceiptsDetail,
  deleteExpenseDetail,
} = require('../controllers/receiptsAndExpenseController');

const router = new Router();

router.route('/receipts/:receipts_id').get(getReceiptsByID);
router.route('/expense/:expense_id').get(getExpenseByID);
router.route('/receipts-expense/:month/:year').get(getReceiptsAndExpenseByMonth);
router.route('/receipts-expense/:year').get(getReceiptsAndExpense);
router.route('/receipts-expense-by-project').get(getReceiptsAndExpenseByMonth);
router.route('/receipts').post(createReceipts);
router.route('/receipts/:revenue_det_id').put(updateRevenue);
router.route('/expense').post(createExpense);
router.route('/expense/:expenditure_det_id').put(updateExpense);
router.route('/receipts/:revenue_id/:revenue_det_id').delete(deleteReceiptsDetail);
router.route('/expense/:expenditure_id/:expenditure_det_id').delete(deleteExpenseDetail);

module.exports = router;
