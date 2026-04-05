const createHttpError = require('http-errors');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { buildQueryFeatures } = require('../utils/apiFeatures');

const createOrder = asyncHandler(async (req, res) => {
  const { customer, items } = req.body;

  // Validate and compute order total based on canonical product prices.
  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const priceMap = new Map(products.map((p) => [String(p._id), p]));

  const normalizedItems = items.map((item) => {
    const product = priceMap.get(String(item.product));
    if (!product) throw createHttpError(400, `Product not found: ${item.product}`);

    return {
      product: product._id,
      quantity: item.quantity,
      unitPrice: product.price
    };
  });

  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const order = await Order.create({
    customer,
    items: normalizedItems,
    totalAmount,
    createdBy: req.user._id
  });

  res.status(201).json({ success: true, data: order });
});

const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildQueryFeatures({ query: req.query });

  const [orders, total] = await Promise.all([
    Order.find()
      .populate('customer', 'name email phone')
      .populate('createdBy', 'fullName email')
      .populate('items.product', 'name sku')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Order.countDocuments()
  ]);

  res.json({
    success: true,
    data: orders,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

module.exports = { createOrder, getOrders };
