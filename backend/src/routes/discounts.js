import express from 'express';
import { DiscountTier, MedicineDiscount } from '../models/Discount.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Discount Tiers
router.get('/tiers', authenticate, async (req, res) => {
  try {
    const tiers = await DiscountTier.find();
    res.json(tiers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tiers', authenticate, requireAdmin, async (req, res) => {
  try {
    const tier = new DiscountTier(req.body);
    await tier.save();
    res.status(201).json(tier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/tiers/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const tier = await DiscountTier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tier) return res.status(404).json({ error: 'Tier not found' });
    res.json(tier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/tiers/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await DiscountTier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Medicine Discounts
router.get('/medicines', authenticate, async (req, res) => {
  try {
    const discounts = await MedicineDiscount.find()
      .populate('itemId')
      .populate('discountTierId');
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/item/:itemId', authenticate, async (req, res) => {
  try {
    const discounts = await MedicineDiscount.find({ itemId: req.params.itemId })
      .populate('discountTierId');
    res.json(discounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/medicines', authenticate, async (req, res) => {
  try {
    const discount = new MedicineDiscount(req.body);
    await discount.save();
    const populated = await discount.populate('discountTierId');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/medicines/:id', authenticate, async (req, res) => {
  try {
    await MedicineDiscount.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discount deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
