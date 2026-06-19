import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    category: String,
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    location: String,
    currentQuantity: { type: Number, default: 0 },
    reorderPoint: { type: Number, default: 10 },
    reorderQuantity: { type: Number, default: 50 },
    unitCost: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    tabletsPerStrip: { type: Number, default: 1 },
    stripsPerBox: { type: Number, default: 1 },
    unitOfMeasure: { type: String, default: 'strip' },
    batchNumber: String,
    lotNumber: String,
    expirationDate: Date,
    isControlledSubstance: { type: Boolean, default: false },
    deaSchedule: String,
    requiresPrescription: { type: Boolean, default: false },
    minStorageTemp: Number,
    maxStorageTemp: Number,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('InventoryItem', inventoryItemSchema);
