import express from 'express';
import mongoose from 'mongoose';
import StockBatch from '../models/StockBatch.js';
import InventoryItem from '../models/InventoryItem.js';
import { authenticate } from '../middleware/auth.js';
import { io } from '../server.js';
import { computeStats } from '../services/statsService.js';

const router = express.Router();

// Get all batches for an item
router.get('/item/:itemId', authenticate, async (req, res) => {
  try {
    const batches = await StockBatch.find({ itemId: req.params.itemId })
      .sort({ expiryDate: 1, receivedDate: 1 });
    
    // Add calculated fields
    const batchesWithDetails = batches.map(batch => ({
      ...batch.toObject(),
      isExpired: batch.isExpired(),
      daysUntilExpiry: batch.daysUntilExpiry(),
      status: batch.isExpired() && batch.status === 'active' ? 'expired' : batch.status
    }));
    
    res.json(batchesWithDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available batches for an item (for invoice selection)
router.get('/available/:itemId', authenticate, async (req, res) => {
  try {
    const batches = await StockBatch.getAvailableBatchesForItem(req.params.itemId);
    
    const batchesWithDetails = batches.map(batch => ({
      ...batch.toObject(),
      isExpired: batch.isExpired(),
      daysUntilExpiry: batch.daysUntilExpiry()
    }));
    
    res.json(batchesWithDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new batch (receive stock)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      itemId,
      batchNumber,
      purchaseOrderId,
      supplierId,
      receivedDate,
      expiryDate,
      quantityReceived,
      costPerUnit,
      location,
      storageConditions,
      notes
    } = req.body;

    // Validate required fields
    if (!itemId || !batchNumber || !expiryDate || !quantityReceived || costPerUnit === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: itemId, batchNumber, expiryDate, quantityReceived, costPerUnit' 
      });
    }

    // Check if item exists
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Create batch
    const batch = new StockBatch({
      itemId,
      batchNumber,
      purchaseOrderId,
      supplierId,
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      expiryDate: new Date(expiryDate),
      quantityReceived,
      quantityAvailable: quantityReceived,
      costPerUnit,
      totalCost: quantityReceived * costPerUnit,
      location: location || item.location,
      storageConditions,
      notes
    });

    await batch.save();

    // Update inventory item with total quantity
    const totalBatchQty = await StockBatch.aggregate([
      { $match: { itemId: mongoose.Types.ObjectId(itemId), status: 'active' } },
      { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
    ]);

    const newTotalQty = totalBatchQty.length > 0 ? totalBatchQty[0].total : quantityReceived;
    
    await InventoryItem.findByIdAndUpdate(
      itemId,
      { 
        currentQuantity: newTotalQty,
        batchNumber, // Update to latest batch
        expirationDate: expiryDate
      },
      { new: true }
    );

    res.status(201).json({
      ...batch.toObject(),
      isExpired: batch.isExpired(),
      daysUntilExpiry: batch.daysUntilExpiry()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update batch (adjust quantity or status)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const batch = await StockBatch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // After updating a batch, recalculate the item's total quantity from active batches
    try {
      const totalBatchQty = await StockBatch.aggregate([
        { $match: { itemId: batch.itemId, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
      ]);

      const newTotalQty = totalBatchQty.length > 0 ? totalBatchQty[0].total : 0;
      await InventoryItem.findByIdAndUpdate(batch.itemId, { currentQuantity: newTotalQty });
      // emit stats update if socket available
      try {
        if (io) {
          const stats = await computeStats();
          io.emit('stats:update', stats);
        }
      } catch (e) {
        console.warn('Failed to emit stats:update after batch update', e);
      }
    } catch (e) {
      console.warn('Failed to recalc item quantity after batch update', e);
    }

    res.json({
      ...batch.toObject(),
      isExpired: batch.isExpired(),
      daysUntilExpiry: batch.daysUntilExpiry()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get FIFO allocation for purchase
router.post('/allocate', authenticate, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ error: 'itemId and quantity are required' });
    }

    const allocation = await StockBatch.allocateStock(itemId, quantity);
    
    res.json({
      itemId,
      quantityRequested: quantity,
      allocation,
      totalCost: allocation.reduce((sum, a) => sum + a.totalCost, 0)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete batch
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const batch = await StockBatch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    // After deletion, recalculate total available from remaining active batches
    try {
      const totalBatchQty = await StockBatch.aggregate([
        { $match: { itemId: batch.itemId, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$quantityAvailable' } } }
      ]);

      const newTotalQty = totalBatchQty.length > 0 ? totalBatchQty[0].total : 0;
      await InventoryItem.findByIdAndUpdate(batch.itemId, { currentQuantity: newTotalQty });
      try {
        if (io) {
          const stats = await computeStats();
          io.emit('stats:update', stats);
        }
      } catch (e) {
        console.warn('Failed to emit stats:update after batch delete', e);
      }
    } catch (e) {
      console.warn('Failed to recalc item quantity after batch delete', e);
    }

    res.json({ message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
