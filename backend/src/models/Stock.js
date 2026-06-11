import mongoose from 'mongoose';

const stockCartonSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    cartonNumber: { type: String, required: true },
    quantityOfBoxes: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    supplierId: mongoose.Schema.Types.ObjectId,
    receivedDate: { type: Date, default: Date.now },
    expirationDate: Date,
    notes: String,
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

export const StockCarton = mongoose.model('StockCarton', stockCartonSchema);

const stockBoxSchema = new mongoose.Schema(
  {
    cartonId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockCarton', required: true },
    boxNumber: { type: Number, required: true },
    stripsPerBox: { type: Number, required: true },
    totalStrips: { type: Number, required: true },
    availableStrips: { type: Number, required: true },
    notes: String,
  },
  { timestamps: true }
);

export const StockBox = mongoose.model('StockBox', stockBoxSchema);
