const express = require('express');
const { createProduct, getProducts } = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createProductValidator } = require('../validators/product.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'STAFF'), getProducts);
router.post('/', authorize('ADMIN'), createProductValidator, validate, createProduct);

module.exports = router;
