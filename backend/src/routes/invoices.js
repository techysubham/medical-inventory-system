import express from 'express';
import { Invoice, InvoiceItem } from '../models/Invoice.js';
import InventoryItem from '../models/InventoryItem.js';
import { authenticate } from '../middleware/auth.js';
import { sendInvoiceEmail } from '../services/email.js';

const router = express.Router();

// Get all invoices
router.get('/', authenticate, async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ invoiceDate: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single invoice with items
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    const items = await InvoiceItem.find({ invoiceId: req.params.id }).populate('itemId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ ...invoice.toObject(), items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create invoice
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, ...invoiceData } = req.body;

    // Generate invoice number (simple format)
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = new Invoice({
      ...invoiceData,
      invoiceNumber,
      createdBy: req.user.id,
    });

    await invoice.save();

    // Create invoice items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const qty = item.quantityStrips || item.qty || 1;
        const unitPrice = item.unitPrice || 0;
        const gstPercent = (item.gstPercent ?? item.gst ?? 0);
        const gstAmount = (item.gstAmount ?? ((qty * unitPrice * (gstPercent / 100))));
        const lineTotal = (item.lineTotal ?? ((qty * unitPrice) + gstAmount));

        const invoiceItemData = {
          invoiceId: invoice._id,
          itemId: item.itemId,
          name: item.name,
          manufacturer: item.manufacturer,
          pack: item.pack,
          hsn: item.hsn,
          batch: item.batch,
          expiry: item.expiry,
          gstPercent,
          gstAmount,
          quantityStrips: qty,
          unitPrice,
          discountPercentage: item.discountPercentage || 0,
          lineTotal,
          notes: item.notes,
        };

        const invoiceItem = new InvoiceItem(invoiceItemData);
        await invoiceItem.save();

        // Update inventory (reduce quantity)
        if (item.itemId) {
          await InventoryItem.findByIdAndUpdate(
            item.itemId,
            { $inc: { currentQuantity: -qty } },
            { new: true }
          );
        }
      }
    }

    const populatedInvoice = await Invoice.findById(invoice._id);
    const populatedItems = await InvoiceItem.find({ invoiceId: invoice._id }).populate('itemId');

    res.status(201).json({ ...populatedInvoice.toObject(), items: populatedItems });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update invoice
router.put('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Send invoice via email
router.post('/:id/send-email', authenticate, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (!invoice.customerEmail) {
      return res.status(400).json({ error: 'Customer email not set' });
    }

    await sendInvoiceEmail(invoice.customerEmail, invoice);
    res.json({ message: 'Invoice sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete invoice
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Delete associated items
    await InvoiceItem.deleteMany({ invoiceId: req.params.id });
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
