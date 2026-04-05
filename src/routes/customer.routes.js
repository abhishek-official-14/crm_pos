const express = require('express');
const { createCustomer, getCustomers } = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createCustomerValidator } = require('../validators/customer.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), getCustomers);
router.post('/', authorize('ADMIN', 'STAFF'), createCustomerValidator, validate, createCustomer);

module.exports = router;
