const Customer = require('../models/customer.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { buildQueryFeatures } = require('../utils/apiFeatures');

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: customer });
});

/**
 * Supports pagination and text search through query params:
 * ?page=1&limit=10&search=john
 */
const getCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip, search } = buildQueryFeatures({
    query: req.query,
    searchableFields: ['name', 'email', 'phone']
  });

  const [customers, total] = await Promise.all([
    Customer.find(search).populate('createdBy', 'fullName email').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Customer.countDocuments(search)
  ]);

  res.json({
    success: true,
    data: customers,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

module.exports = { createCustomer, getCustomers };
