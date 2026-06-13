import express from 'express';
import Supplier from '../models/Supplier.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { io } from '../server.js';
import { computeStats } from '../services/statsService.js';

const router = express.Router();

// Get all suppliers
router.get('/', authenticate, requirePermission('view_suppliers'), async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single supplier
router.get('/:id', authenticate, requirePermission('view_suppliers'), async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create supplier
router.post('/', authenticate, requirePermission('manage_suppliers'), async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after supplier create', e);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update supplier
router.put('/:id', authenticate, requirePermission('manage_suppliers'), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after supplier update', e);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete supplier
router.delete('/:id', authenticate, requirePermission('manage_suppliers'), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after supplier delete', e);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
