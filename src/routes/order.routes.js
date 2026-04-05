const express = require('express');
const { createOrder, getOrders } = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createOrderValidator } = require('../validators/order.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), getOrders);
router.post('/', authorize('ADMIN', 'STAFF'), createOrderValidator, validate, createOrder);

module.exports = router;
