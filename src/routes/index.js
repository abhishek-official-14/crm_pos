const express = require('express');
const authRoutes = require('./auth.routes');
const customerRoutes = require('./customer.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
