const createHttpError = require('http-errors');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { buildQueryFeatures } = require('../utils/apiFeatures');
const { buildInvoicePdfBuffer } = require('../utils/invoicePdf');

const DEFAULT_GST_RATE = 18;
const INVOICE_RETRY_LIMIT = 3;

const toMoney = (value) => Number(value.toFixed(2));

const createOrder = asyncHandler(async (req, res) => {
  const { customer, items, gstRate = DEFAULT_GST_RATE } = req.body;

  const requestedQuantityByProduct = items.reduce((acc, item) => {
    const key = String(item.product);
    acc.set(key, (acc.get(key) || 0) + Number(item.quantity));
    return acc;
  }, new Map());

  const productIds = [...requestedQuantityByProduct.keys()];
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const normalizedItems = items.map((item) => {
    const product = productMap.get(String(item.product));
    if (!product) throw createHttpError(400, `Product not found: ${item.product}`);

    if (product.stock < item.quantity) {
      throw createHttpError(400, `Insufficient stock for ${product.name}. Remaining stock: ${product.stock}`);
    }

    return {
      product: product._id,
      quantity: item.quantity,
      unitPrice: product.price,
      unitCost: product.costPrice
    };
  });

  await Promise.all(
    [...requestedQuantityByProduct.entries()].map(async ([productId, quantity]) => {
      const updateResult = await Product.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        {
          $inc: { stock: -quantity },
          $set: { updatedAt: new Date() }
        }
      );

      if (updateResult.modifiedCount !== 1) {
        const latestProduct = await Product.findById(productId, 'name stock');
        const productName = latestProduct?.name || productId;
        const remainingStock = latestProduct?.stock ?? 0;
        throw createHttpError(
          409,
          `Stock changed while processing order for ${productName}. Remaining stock: ${remainingStock}`
        );
      }
    })
  );

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const costAmount = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const taxAmount = subtotal * (Number(gstRate) / 100);
  const totalAmount = subtotal + taxAmount;
  const profitAmount = totalAmount - taxAmount - costAmount;
  let order;
  const buildInvoiceNumber = () => {
    const now = new Date();
    return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  try {
    for (let attempt = 1; attempt <= INVOICE_RETRY_LIMIT; attempt += 1) {
      const invoiceNumber = buildInvoiceNumber();
      try {
        order = await Order.create({
          customer,
          items: normalizedItems,
          subtotal: toMoney(subtotal),
          taxRate: Number(gstRate),
          taxAmount: toMoney(taxAmount),
          totalAmount: toMoney(totalAmount),
          costAmount: toMoney(costAmount),
          profitAmount: toMoney(profitAmount),
          invoiceNumber,
          createdBy: req.user._id
        });
        break;
      } catch (error) {
        if (error?.code === 11000 && attempt < INVOICE_RETRY_LIMIT) {
          continue;
        }
        throw error;
      }
    }
    if (!order) {
      throw createHttpError(500, 'Unable to generate invoice number');
    }
  } catch (error) {
    await Promise.all(
      [...requestedQuantityByProduct.entries()].map(([productId, quantity]) =>
        Product.updateOne({ _id: productId }, { $inc: { stock: quantity }, $set: { updatedAt: new Date() } })
      )
    );
    throw error;
  }

  const updatedProducts = await Product.find({ _id: { $in: productIds } }, 'name sku stock lowStockThreshold').lean();
  const lowStockAlerts = updatedProducts
    .filter((product) => product.stock <= product.lowStockThreshold)
    .map((product) => ({
      productId: String(product._id),
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      threshold: product.lowStockThreshold
    }));

  res.status(201).json({
    success: true,
    data: order,
    meta: {
      updatedProducts,
      lowStockAlerts
    }
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildQueryFeatures({ query: req.query });

  const [orders, total] = await Promise.all([
    Order.find()
      .populate('customer', 'name email phone')
      .populate('createdBy', 'fullName email')
      .populate('items.product', 'name sku price costPrice')
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

const getOrderInvoicePdf = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('items.product', 'name sku');

  if (!order) throw createHttpError(404, 'Order not found');

  const pdfBuffer = buildInvoicePdfBuffer(order);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${order.invoiceNumber || `invoice-${order._id}`}.pdf"`);
  res.send(pdfBuffer);
});

const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[,"\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const exportOrdersCsv = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('customer', 'name email')
    .populate('items.product', 'name sku')
    .sort({ createdAt: -1 })
    .lean();

  const header = [
    'invoiceNumber',
    'date',
    'customer',
    'items',
    'subtotal',
    'gstRate',
    'gstAmount',
    'totalAmount',
    'costAmount',
    'profitAmount',
    'status'
  ];

  const rows = orders.map((order) => {
    const itemSummary = order.items
      .map((item) => `${item.product?.name || 'N/A'} x${item.quantity} @ ${item.unitPrice}`)
      .join(' | ');

    return [
      order.invoiceNumber,
      new Date(order.createdAt).toISOString(),
      order.customer?.name || 'Walk-in',
      itemSummary,
      order.subtotal,
      order.taxRate,
      order.taxAmount,
      order.totalAmount,
      order.costAmount,
      order.profitAmount,
      order.status
    ]
      .map(escapeCsv)
      .join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="orders-report.csv"');
  res.send(csv);
});

const getSalesAnalytics = asyncHandler(async (req, res) => {
  const period = req.query.period === 'monthly' ? 'monthly' : 'daily';

  const groupId =
    period === 'monthly'
      ? {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        }
      : {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };

  const analytics = await Order.aggregate([
    {
      $group: {
        _id: groupId,
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
        gstCollected: { $sum: '$taxAmount' },
        cost: { $sum: '$costAmount' },
        profit: { $sum: '$profitAmount' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    { $limit: 60 }
  ]);

  res.json({ success: true, data: analytics, meta: { period } });
});

module.exports = { createOrder, getOrders, getOrderInvoicePdf, exportOrdersCsv, getSalesAnalytics };
