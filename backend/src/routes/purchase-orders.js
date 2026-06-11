import express from 'express';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all purchase orders
router.get('/', authenticate, requirePermission('view_orders'), async (req, res) => {
  try {
    const orders = await PurchaseOrder.find()
      .populate('supplierId')
      .populate('items.itemId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single purchase order
router.get('/:id', authenticate, requirePermission('view_orders'), async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplierId')
      .populate('items.itemId');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create purchase order
router.post('/', authenticate, requirePermission('manage_orders'), async (req, res) => {
  try {
    console.log('Create purchase order request:', { body: req.body, user: req.user && req.user._id });
    const orderNumber = `PO-${Date.now()}`;

    // Resolve supplierId: allow passing either ObjectId or supplier name/email
    let supplierId = req.body.supplierId;
    if (supplierId && typeof supplierId === 'string' && !mongoose.Types.ObjectId.isValid(supplierId)) {
      const found = await Supplier.findOne({ $or: [{ name: supplierId }, { email: supplierId }] });
      if (!found) return res.status(400).json({ error: 'Supplier not found. Provide a valid supplier ID or existing supplier name/email.' });
      supplierId = found._id;
    }

    const orderData = {
      ...req.body,
      supplierId,
      orderNumber,
      createdBy: req.user._id,
    };

    const order = new PurchaseOrder(orderData);
    await order.save();
    await order.populate('supplierId').populate('items.itemId');
    res.status(201).json(order);
  } catch (err) {
    // Send validation, cast and duplicate key errors with clearer messages
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 11000) {
      // duplicate key (e.g., unique orderNumber)
      const key = Object.keys(err.keyValue || {}).join(', ');
      return res.status(400).json({ error: `Duplicate value for unique field(s): ${key}` });
    }
    console.error('Purchase order create error:', err, err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update purchase order
router.put('/:id', authenticate, requirePermission('manage_orders'), async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('supplierId')
      .populate('items.itemId');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete purchase order
router.delete('/:id', authenticate, requirePermission('manage_orders'), async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
