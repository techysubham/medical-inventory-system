import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'manager', 'staff'],
      default: 'staff',
    },
    // Permissions array - defines which modules/pages user can access
    permissions: {
      type: [String],
      enum: [
        'view_inventory',
        'manage_inventory',
        'view_discounts',
        'manage_discounts',
        'view_invoices',
        'manage_invoices',
        'view_orders',
        'manage_orders',
        'view_reports',
        'manage_reports',
        'view_alerts',
        'manage_users',
        'view_suppliers',
        'manage_suppliers',
        'view_settings',
        'manage_settings',
      ],
      default: [],
    },
    // Is user account active
    isActive: { type: Boolean, default: true },
    // Super admin bypass flag (only for superadmin role)
    isSuperAdmin: { type: Boolean, default: false },
    // Created by which admin
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (inputPassword) {
  return await bcryptjs.compare(inputPassword, this.password);
};

// Get all accessible pages based on role and permissions
userSchema.methods.getAccessiblePages = function () {
  // Super admin has access to everything
  if (this.isSuperAdmin || this.role === 'superadmin') {
    return [
      'dashboard',
      'inventory',
      'discounts',
      'invoices',
      'reports',
      'suppliers',
      'users',
      'settings',
    ];
  }

  // Map permissions to pages
  const permissionToPages = {
    view_inventory: 'inventory',
    manage_inventory: 'inventory',
    view_discounts: 'discounts',
    manage_discounts: 'discounts',
    view_invoices: 'invoices',
    manage_invoices: 'invoices',
    view_orders: 'purchase-orders',
    manage_orders: 'purchase-orders',
    view_reports: 'reports',
    manage_reports: 'reports',
    view_alerts: 'alerts',
    manage_users: 'users',
    view_suppliers: 'suppliers',
    manage_suppliers: 'suppliers',
    view_settings: 'settings',
    manage_settings: 'settings',
  };

  const pages = new Set(['dashboard']); // Dashboard always accessible
  this.permissions.forEach((perm) => {
    const page = permissionToPages[perm];
    if (page) pages.add(page);
  });

  return Array.from(pages);
};

// Check if user has specific permission
userSchema.methods.hasPermission = function (permission) {
  if (this.isSuperAdmin || this.role === 'superadmin') return true;
  return this.permissions.includes(permission);
};

export default mongoose.model('User', userSchema);
