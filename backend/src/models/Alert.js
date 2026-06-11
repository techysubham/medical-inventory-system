import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    type: { type: String, enum: ['stock', 'expiry', 'order', 'system', 'other'], default: 'system' },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    relatedItemId: mongoose.Schema.Types.ObjectId,
    relatedOrderId: mongoose.Schema.Types.ObjectId,
    actionRequired: { type: Boolean, default: false },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Alert', alertSchema);
