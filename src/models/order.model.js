const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, 'Order requires at least one item']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      default: 18
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    costAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    profitAmount: {
      type: Number,
      required: true,
      default: 0
    },
    invoiceNumber: {
      type: String,
      trim: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED'],
      default: 'PENDING'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
