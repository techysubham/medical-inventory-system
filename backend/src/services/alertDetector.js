import InventoryItem from '../models/InventoryItem.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Alert from '../models/Alert.js';
import { AppSettings } from '../models/Settings.js';
import { io } from '../server.js';
import { computeStats } from './statsService.js';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

async function getSettings() {
  try {
    const s = await AppSettings.findOne();
    return s || { lowStockThreshold: 20, expiryWarningDays: 30 };
  } catch (err) {
    console.warn('Failed to load app settings, using defaults', err);
    return { lowStockThreshold: 20, expiryWarningDays: 30 };
  }
}

async function dedupeAlert(type, relatedItemId, windowMs = DAY_MS) {
  const cutoff = new Date(Date.now() - windowMs);
  const existing = await Alert.findOne({ type, relatedItemId, createdAt: { $gte: cutoff } });
  return !!existing;
}

export async function runDetectors() {
  try {
    const settings = await getSettings();

    // Low-stock detector: alert if strips quantity < 200
    const stripThreshold = settings.lowStockStripThreshold || 200;
    const lowStockItems = await InventoryItem.find({ currentQuantity: { $lt: stripThreshold } });
    for (const item of lowStockItems) {
      const severity = item.currentQuantity <= 0 ? 'high' : item.currentQuantity <= 50 ? 'medium' : 'low';
      const title = `Low stock alert: ${item.name}`;
      const message = `${item.name} (SKU: ${item.sku}) quantity is ${item.currentQuantity} strips. Alert threshold: ${stripThreshold} strips.`;
      const already = await dedupeAlert('stock', item._id);
      if (already) continue;
      const created = await Alert.create({ title, message, severity, type: 'stock', relatedItemId: item._id, actionRequired: true });
      try {
        if (io) io.emit('alert:created', created);
      } catch (e) {
        console.warn('Failed to emit alert:created via Socket.IO', e);
      }
    }

    // Expiry detector: alert if expiry within 1 month (30 days)
    const expiryWarningDays = settings.expiryWarningDays || 30; // 1 month
    const now = new Date();
    const until = new Date(Date.now() + expiryWarningDays * DAY_MS);
    const expiringItems = await InventoryItem.find({ expirationDate: { $gte: now, $lte: until } });
    for (const item of expiringItems) {
      const daysLeft = Math.ceil((item.expirationDate - now) / DAY_MS);
      let severity = 'low';
      if (daysLeft <= 7) severity = 'high';        // < 1 week: critical
      else if (daysLeft <= 14) severity = 'medium'; // < 2 weeks: warning
      else severity = 'low';                        // > 2 weeks: info
      const title = `Expiry alert: ${item.name}`;
      const message = `${item.name} (SKU: ${item.sku}) expires in ${daysLeft} day(s) on ${item.expirationDate.toISOString().split('T')[0]}.`;
      const already = await dedupeAlert('expiry', item._id);
      if (already) continue;
      const created = await Alert.create({ title, message, severity, type: 'expiry', relatedItemId: item._id, actionRequired: true });
      try {
        if (io) io.emit('alert:created', created);
      } catch (e) {
        console.warn('Failed to emit alert:created via Socket.IO', e);
      }
    }

    // Overdue purchase orders detector (dueDate passed and not delivered)
    const overdueOrders = await PurchaseOrder.find({ dueDate: { $lte: new Date() }, status: { $ne: 'delivered' } });
    for (const order of overdueOrders) {
      const title = `Overdue Purchase Order: ${order.orderNumber}`;
      const message = `Purchase order ${order.orderNumber} is overdue (status: ${order.status}). Due date: ${order.dueDate ? order.dueDate.toISOString().split('T')[0] : 'N/A'}.`;
      const already = await dedupeAlert('order', order._id);
      if (already) continue;
      const created = await Alert.create({ title, message, severity: 'high', type: 'order', relatedOrderId: order._id, actionRequired: true });
      try {
        if (io) io.emit('alert:created', created);
      } catch (e) {
        console.warn('Failed to emit alert:created via Socket.IO', e);
      }
    }

    console.log('Alert detectors run complete');
    
    // Emit updated stats after running detectors so low-stock and expiring counts update in realtime
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after running detectors', e);
    }
  } catch (err) {
    console.error('Error running alert detectors:', err);
  }
}

let _interval = null;
export async function startScheduler(freqMs) {
  try {
    // If no frequency passed, read from AppSettings (minutes)
    if (typeof freqMs === 'undefined' || freqMs === null) {
      const s = await AppSettings.findOne();
      const minutes = (s && s.alertSchedulerIntervalMinutes) ? s.alertSchedulerIntervalMinutes : 30;
      freqMs = minutes * MINUTE_MS;
    }

    // Run immediately, then schedule
    await runDetectors();
    if (_interval) clearInterval(_interval);
    _interval = setInterval(() => runDetectors(), freqMs);
    console.log('Alert detector scheduler started; interval ms=', freqMs);
  } catch (err) {
    console.error('Failed to start scheduler with freqMs=', freqMs, err);
  }
}

export function stopScheduler() {
  if (_interval) clearInterval(_interval);
}
