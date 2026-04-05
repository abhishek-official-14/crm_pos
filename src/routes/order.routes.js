const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderInvoicePdf,
  exportOrdersCsv,
  getSalesAnalytics
} = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createOrderValidator } = require('../validators/order.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), getOrders);
router.get('/analytics', authorize('ADMIN', 'STAFF'), getSalesAnalytics);
router.get('/export/csv', authorize('ADMIN', 'STAFF'), exportOrdersCsv);
router.get('/:id/invoice.pdf', authorize('ADMIN', 'STAFF'), getOrderInvoicePdf);
router.post('/', authorize('ADMIN', 'STAFF'), createOrderValidator, validate, createOrder);

module.exports = router;
