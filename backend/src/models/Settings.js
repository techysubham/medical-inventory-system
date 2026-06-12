import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    settingKey: { type: String, required: true, unique: true },
    settingValue: mongoose.Schema.Types.Mixed,
    description: String,
    category: { type: String, enum: ['general', 'inventory', 'billing', 'notification', 'security'], default: 'general' },
    isEditable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const appSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'Medical Inventory' },
    siteEmail: { type: String, default: 'admin@medinventory.com' },
    currency: { type: String, default: 'USD' },
    taxRate: { type: Number, default: 10 },
    maintenanceMode: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 20 },
    lowStockStripThreshold: { type: Number, default: 200 },
    expiryWarningDays: { type: Number, default: 30 },
    // How often (in minutes) the alert detectors run. Default: 30 minutes
    alertSchedulerIntervalMinutes: { type: Number, default: 30 },
    defaultDiscount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingsSchema);
export const AppSettings = mongoose.model('AppSettings', appSettingsSchema);
