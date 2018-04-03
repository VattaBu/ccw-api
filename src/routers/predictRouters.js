const { Router } = require('express');
const {
  getPredictRev,
  getPredictExp,
  getPredictRevByID,
  getPredictExpByID,
  createPredictRev,
  createPredictExpense,
  updatePredictRev,
  updatePredictExp,
  deletePredictRevDetail,
  deletePredictExpDetail,
} = require('../controllers/predictController');

const router = new Router();

router.route('/predict-revenue/:predict_revenue_id').get(getPredictRevByID);
router.route('/predict-expenditure/:predict_expenditure_id').get(getPredictExpByID);
router.route('/predict-revenue').post(createPredictRev);
router.route('/predict-expenditure').post(createPredictExpense);
router.route('/predict-revenue/:predict_revenue_det_id').put(updatePredictRev);
router.route('/predict-expenditure/:predict_expenditure_det_id').put(updatePredictExp);
router.route('/predict-revenue/:predict_revenue_det_id').delete(deletePredictRevDetail);
router.route('/predict-expenditure/:predict_expenditure_det_id').delete(deletePredictExpDetail);

// router.route('/receipts/:receipts_id').get(getReceiptsByID);
// router.route('/expense/:expense_id').get(getExpenseByID);
// router.route('/receipts-expense/:month/:year').get(getReceiptsAndExpenseByMonth);
// router.route('/receipts-expense/:year').get(getReceiptsAndExpense);
// router.route('/receipts-expense-by-project').get(getReceiptsAndExpenseByMonth);
// router.route('/receipts').post(createReceipts);
// router.route('/receipts/:revenue_det_id').put(updateRevenue);
// router.route('/expense').post(createExpense);
// router.route('/expense/:expenditure_det_id').put(updateExpense);
// router.route('/receipts/:revenue_id/:revenue_det_id').delete(deleteReceiptsDetail);
// router.route('/expense/:expenditure_id/:expenditure_det_id').delete(deleteExpenseDetail);



module.exports = router;
