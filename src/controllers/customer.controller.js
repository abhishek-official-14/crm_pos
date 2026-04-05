const Customer = require('../models/customer.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { buildQueryFeatures } = require('../utils/apiFeatures');
const { fetchPaginatedResults } = require('../utils/paginatedQuery');

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

  const { items, meta } = await fetchPaginatedResults({
    model: Customer,
    filter: search,
    page,
    limit,
    skip,
    sort: { createdAt: -1 },
    select: 'name email phone createdBy createdAt updatedAt',
    populate: { path: 'createdBy', select: 'fullName email' }
  });

  res.json({
    success: true,
    data: items,
    meta
  });
});

module.exports = { createCustomer, getCustomers };
