import express from 'express';
import InventoryItem from '../models/InventoryItem.js';
import { StockCarton, StockBox } from '../models/Stock.js';
import Alert from '../models/Alert.js';
import { authenticate } from '../middleware/auth.js';
import { io } from '../server.js';
import { computeStats } from '../services/statsService.js';

const router = express.Router();

// Helper: Recalculate and persist currentQuantity for an item
async function recalcItemQuantity(itemId) {
  try {
    const cartons = await StockCarton.find({ itemId }).select('_id');
    const cartonIds = cartons.map((c) => c._id);
    if (cartonIds.length === 0) {
      await InventoryItem.findByIdAndUpdate(itemId, { currentQuantity: 0 });
      return;
    }

    const result = await StockBox.aggregate([
      { $match: { cartonId: { $in: cartonIds } } },
      { $group: { _id: null, total: { $sum: '$availableStrips' } } },
    ]);

    const total = result && result[0] ? result[0].total : 0;
    await InventoryItem.findByIdAndUpdate(itemId, { currentQuantity: total });
  } catch (err) {
    console.error('Failed to recalc item quantity for', itemId, err);
  }
}

// More specific routes FIRST (before generic /:id routes)

// Get boxes in a carton
router.get('/cartons/:cartonId/boxes', authenticate, async (req, res) => {
  try {
    const boxes = await StockBox.find({ cartonId: req.params.cartonId });
    res.json(boxes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create box in carton
router.post('/cartons/:cartonId/boxes', authenticate, async (req, res) => {
  try {
    const box = new StockBox({ ...req.body, cartonId: req.params.cartonId });
    await box.save();

    // Recalculate item quantity for the parent item
    const carton = await StockCarton.findById(req.params.cartonId);
    if (carton) {
      await recalcItemQuantity(carton.itemId);
    }

    res.status(201).json(box);
    // emit updated stats after inventory change
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after creating box', e);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Bulk create boxes in a carton (insertMany) to avoid N sequential requests
router.post('/cartons/:cartonId/boxes/bulk', authenticate, async (req, res) => {
  try {
    const boxes = Array.isArray(req.body) ? req.body : req.body.boxes;
    if (!Array.isArray(boxes) || boxes.length === 0) {
      return res.status(400).json({ error: 'Boxes array required' });
    }

    // Attach cartonId to each box
    const toInsert = boxes.map((b) => ({ ...b, cartonId: req.params.cartonId }));

    // Use insertMany for performance
    const inserted = await StockBox.insertMany(toInsert);

    // Recalculate item quantity once
    const carton = await StockCarton.findById(req.params.cartonId);
    if (carton) {
      await recalcItemQuantity(carton.itemId);
    }

    res.status(201).json(inserted);
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after bulk insert', e);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete carton
router.delete('/cartons/:cartonId', authenticate, async (req, res) => {
  try {
    // find carton to get itemId
    const carton = await StockCarton.findById(req.params.cartonId);
    if (!carton) return res.status(404).json({ error: 'Carton not found' });

    await StockBox.deleteMany({ cartonId: req.params.cartonId });
    await StockCarton.findByIdAndDelete(req.params.cartonId);

    // Recalculate item quantity
    await recalcItemQuantity(carton.itemId);

    res.json({ message: 'Carton deleted' });
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after carton delete', e);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete box
router.delete('/boxes/:boxId', authenticate, async (req, res) => {
  try {
    // find box to get cartonId
    const box = await StockBox.findById(req.params.boxId);
    if (!box) return res.status(404).json({ error: 'Box not found' });

    const carton = await StockCarton.findById(box.cartonId);
    await StockBox.findByIdAndDelete(req.params.boxId);

    // Recalculate item quantity if we have the itemId
    if (carton) await recalcItemQuantity(carton.itemId);

    res.json({ message: 'Box deleted' });
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after box delete', e);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all inventory items
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create inventory item
router.post('/', authenticate, async (req, res) => {
  try {
    const item = new InventoryItem(req.body);
    await item.save();
    res.status(201).json(item);
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after item create', e);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Batch create multiple cartoons with boxes per carton (specific route first)
router.post('/:itemId/cartons/batch', authenticate, async (req, res) => {
  try {
    const { numberOfCartoons, numberOfBoxesPerCarton, stripsPerBox, purchasePrice, supplierId, receivedDate, expirationDate, notes } = req.body;
    
    if (!numberOfCartoons || !numberOfBoxesPerCarton || !stripsPerBox) {
      return res.status(400).json({ error: 'numberOfCartoons, numberOfBoxesPerCarton, and stripsPerBox are required' });
    }

    const itemId = req.params.itemId;
    const createdCartons = [];
    let allBoxesToInsert = [];

    // Get the highest existing carton number for this item
    const lastCarton = await StockCarton.findOne({ itemId }).sort({ cartonNumber: -1 });
    let nextCartonNum = lastCarton ? parseInt(lastCarton.cartonNumber) + 1 : 1;

    // Create cartoons and collect boxes
    for (let c = 0; c < numberOfCartoons; c++) {
      const cartonData = {
        itemId,
        cartonNumber: (nextCartonNum + c).toString(),
        quantityOfBoxes: numberOfBoxesPerCarton,
        purchasePrice,
        supplierId: supplierId || undefined,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        notes: notes || undefined,
        status: 'active',
      };
      const carton = new StockCarton(cartonData);
      await carton.save();
      createdCartons.push(carton);

      // Build boxes for this carton
      for (let b = 1; b <= numberOfBoxesPerCarton; b++) {
        allBoxesToInsert.push({
          cartonId: carton._id,
          boxNumber: b,
          stripsPerBox,
          totalStrips: stripsPerBox,
          availableStrips: stripsPerBox,
        });
      }
    }

    // Bulk insert all boxes
    if (allBoxesToInsert.length > 0) {
      await StockBox.insertMany(allBoxesToInsert);
    }

    // Recalculate item quantity once
    await recalcItemQuantity(itemId);

    res.status(201).json({
      message: `Created ${numberOfCartoons} carton(s) with ${numberOfBoxesPerCarton} boxes each`,
      cartoons: createdCartons,
      totalBoxes: allBoxesToInsert.length,
      totalStrips: numberOfCartoons * numberOfBoxesPerCarton * stripsPerBox,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get cartons for an item
router.get('/:itemId/cartons', authenticate, async (req, res) => {
  try {
    const cartons = await StockCarton.find({ itemId: req.params.itemId }).populate('supplierId');
    res.json(cartons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create single carton
router.post('/:itemId/cartons', authenticate, async (req, res) => {
  try {
    const carton = new StockCarton({ ...req.body, itemId: req.params.itemId });
    await carton.save();
    res.status(201).json(carton);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single item
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update inventory item
router.put('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    // Clear old low-stock alerts for this item if quantity is now above threshold
    if (req.body.currentQuantity !== undefined) {
      const threshold = 200;
      if (req.body.currentQuantity >= threshold) {
        await Alert.deleteMany({ relatedItemId: req.params.id, type: 'stock' });
        console.log(`Cleared low-stock alerts for item ${req.params.id}`);
      }
    }
    
    res.json(item);
    try {
      if (io) {
        const stats = await computeStats();
        io.emit('stats:update', stats);
      }
    } catch (e) {
      console.warn('Failed to emit stats:update after item update', e);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete inventory item
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
