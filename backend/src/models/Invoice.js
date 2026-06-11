import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true },
    invoiceDate: { type: Date, default: Date.now },
    customerName: { type: String, required: true },
    customerEmail: String,
    customerPhone: String,
    customerAddress: String,
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'partial'], default: 'unpaid' },
    paymentMethod: String,
    notes: String,
    createdBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

export const Invoice = mongoose.model('Invoice', invoiceSchema);

const invoiceItemSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    name: { type: String },
    manufacturer: { type: String },
    pack: { type: String },
    hsn: { type: String },
    batch: { type: String },
    expiry: { type: Date },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    quantityStrips: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    discountTierId: mongoose.Schema.Types.ObjectId,
    lineTotal: { type: Number, required: true },
    notes: String,
  },
  { timestamps: true }
);

export const InvoiceItem = mongoose.model('InvoiceItem', invoiceItemSchema);
