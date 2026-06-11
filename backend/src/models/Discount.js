import mongoose from 'mongoose';

const discountTierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    discountPercentage: { type: Number, required: true, unique: true },
    description: String,
    colorCode: { type: String, default: '#FF6B6B' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DiscountTier = mongoose.model('DiscountTier', discountTierSchema);

const medicineDiscountSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    discountTierId: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscountTier', required: true },
    reason: String,
    isAvailable: { type: Boolean, default: true },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveTo: Date,
  },
  { timestamps: true }
);

export const MedicineDiscount = mongoose.model('MedicineDiscount', medicineDiscountSchema);
