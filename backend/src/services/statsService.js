import InventoryItem from '../models/InventoryItem.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { Invoice } from '../models/Invoice.js';
import { AppSettings } from '../models/Settings.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function computeStats() {
  try {
    const totalMedicines = await InventoryItem.countDocuments({});
    const activeSuppliers = await Supplier.countDocuments({ status: 'active' });
    const pendingOrders = await PurchaseOrder.countDocuments({ status: 'pending' });

    // Read settings for thresholds
    const settings = await AppSettings.findOne();

    // Low-stock: use stripThreshold (lowStockStripThreshold) like in alertDetector (default 200)
    const stripThreshold = (settings && settings.lowStockStripThreshold) ? settings.lowStockStripThreshold : 200;
    const lowStockCount = await InventoryItem.countDocuments({ currentQuantity: { $lt: stripThreshold } });

    // Expiring soon: exact same logic as alertDetector
    const expiryDays = (settings && settings.expiryWarningDays) ? settings.expiryWarningDays : 30;
    const now = new Date();
    const until = new Date(Date.now() + expiryDays * DAY_MS);
    const expiringSoonCount = await InventoryItem.countDocuments({ expirationDate: { $gte: now, $lte: until } });

    // Unpaid invoices: paymentStatus unpaid or partial
    const unpaidInvoices = await Invoice.countDocuments({ paymentStatus: { $in: ['unpaid', 'partial'] } });

    return { totalMedicines, activeSuppliers, pendingOrders, lowStockCount, expiringSoonCount, unpaidInvoices };
  } catch (err) {
    console.error('Failed to compute stats', err);
    return { totalMedicines: 0, activeSuppliers: 0, pendingOrders: 0, lowStockCount: 0, expiringSoonCount: 0, unpaidInvoices: 0 };
  }
}
