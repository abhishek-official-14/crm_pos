const Product = require('../models/product.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { buildQueryFeatures } = require('../utils/apiFeatures');
const { fetchPaginatedResults } = require('../utils/paginatedQuery');

const createProduct = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    costPrice: req.body.costPrice ?? req.body.price ?? 0,
    createdBy: req.user._id
  };

  const product = await Product.create(payload);
  res.status(201).json({ success: true, data: product });
});

const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip, search } = buildQueryFeatures({
    query: req.query,
    searchableFields: ['name', 'sku']
  });

  const { items, meta } = await fetchPaginatedResults({
    model: Product,
    filter: search,
    page,
    limit,
    skip,
    select: 'name sku price costPrice stock lowStockThreshold createdAt updatedAt',
    sort: { createdAt: -1 }
  });

  res.json({
    success: true,
    data: items,
    meta
  });
});

module.exports = { createProduct, getProducts };
