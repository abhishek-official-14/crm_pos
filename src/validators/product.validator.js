const { body } = require('express-validator');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or greater'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Cost price must be 0 or greater'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or greater'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be 0 or greater')
];

module.exports = { createProductValidator };
