import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    supplierCode: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    address: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    contactPerson: String,
    paymentTerms: String,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    notes: String,
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Supplier', supplierSchema);
