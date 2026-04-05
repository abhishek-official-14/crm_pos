const Product = require('../models/product.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { buildQueryFeatures } = require('../utils/apiFeatures');

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: product });
});

const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip, search } = buildQueryFeatures({
    query: req.query,
    searchableFields: ['name', 'sku']
  });

  const [products, total] = await Promise.all([
    Product.find(search).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Product.countDocuments(search)
  ]);

  res.json({
    success: true,
    data: products,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

module.exports = { createProduct, getProducts };
