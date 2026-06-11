import express from 'express';
import { AppSettings } from '../models/Settings.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all settings
router.get('/', authenticate, async (req, res) => {
  try {
    let settings = await AppSettings.findOne();
    if (!settings) {
      // Create default settings if they don't exist
      settings = await AppSettings.create({
        siteName: 'White Crown',
        siteEmail: 'admin@medinventory.com',
        currency: 'USD',
        taxRate: 10,
        maintenanceMode: false,
        lowStockThreshold: 20,
        expiryWarningDays: 30,
        defaultDiscount: 0,
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/', authenticate, requirePermission('manage_settings'), async (req, res) => {
  try {
    let settings = await AppSettings.findOne();
    if (!settings) {
      settings = await AppSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
