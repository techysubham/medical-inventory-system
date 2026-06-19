import express from 'express';
import InventoryItem from '../models/InventoryItem.js';
import Supplier from '../models/Supplier.js';
import { Invoice } from '../models/Invoice.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', authenticate, requirePermission('view_reports'), async (req, res) => {
  try {
    const totalItems = await InventoryItem.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    
    const invoiceStats = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const totalRevenue = invoiceStats.length > 0 ? invoiceStats[0].total : 0;

    res.json({
      totalItems,
      totalSuppliers,
      totalInvoices,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment method statistics
router.get('/payment-methods', authenticate, requirePermission('view_reports'), async (req, res) => {
  try {
    const paymentStats = await Invoice.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Ensure all payment methods are represented
    const methods = ['Cash', 'UPI', 'Card'];
    const result = methods.map(method => {
      const found = paymentStats.find(stat => stat._id === method);
      return {
        method,
        count: found?.count || 0,
        total: found?.total || 0
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get inventory report
router.get('/inventory', authenticate, requirePermission('view_reports'), async (req, res) => {
  try {
    const items = await InventoryItem.find()
      .select('sku name category currentQuantity unitCost sellingPrice expirationDate status')
      .sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get low stock items
router.get('/low-stock', authenticate, requirePermission('view_reports'), async (req, res) => {
  try {
    const lowStockItems = await InventoryItem.find({
      $expr: { $lte: ['$currentQuantity', '$reorderPoint'] },
    }).sort({ currentQuantity: 1 });
    res.json(lowStockItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expiring items
router.get('/expiring', authenticate, requirePermission('view_reports'), async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringItems = await InventoryItem.find({
      expirationDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow,
      },
    }).sort({ expirationDate: 1 });
    res.json(expiringItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
