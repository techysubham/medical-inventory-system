import express from 'express';
import mongoose from 'mongoose';
import { Invoice, InvoiceItem } from '../models/Invoice.js';
import InventoryItem from '../models/InventoryItem.js';
import StockBatch from '../models/StockBatch.js';
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

    // Create invoice items with FIFO batch allocation
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const qty = item.quantityStrips || item.qty || 1;
        const unitPrice = item.unitPrice || 0;
        const gstPercent = (item.gstPercent ?? item.gst ?? 0);
        const gstAmount = (item.gstAmount ?? ((qty * unitPrice * (gstPercent / 100))));
        const lineTotal = (item.lineTotal ?? ((qty * unitPrice) + gstAmount));

        // Allocate from batches using FIFO
        let batchUsed = null;
        let batchExpiry = null;

        if (item.itemId) {
          try {
            // Get FIFO allocation
            const allocation = await StockBatch.allocateStock(item.itemId, qty);
            
            if (allocation && allocation.length > 0) {
              // Use the first batch for display (oldest one)
              const firstBatch = allocation[0];
              batchUsed = firstBatch.batchNumber;
              batchExpiry = firstBatch.expiryDate;
              
              // Update all allocated batches
              for (const allocEntry of allocation) {
                await StockBatch.findByIdAndUpdate(
                  allocEntry.batchId,
                  { 
                    $inc: { 
                      quantityAvailable: -allocEntry.quantityAllocated,
                      quantitySold: allocEntry.quantityAllocated
                    }
                  }
                );
              }
            }
          } catch (batchErr) {
            console.warn(`Batch allocation failed for item ${item.itemId}:`, batchErr.message);
            // Fall back to using provided batch info if batch allocation fails
            batchUsed = item.batch || null;
            batchExpiry = item.expiry || null;
          }
        }

        const invoiceItemData = {
          invoiceId: invoice._id,
          itemId: item.itemId,
          name: item.name,
          manufacturer: item.manufacturer,
          pack: item.pack,
          hsn: item.hsn,
          batch: batchUsed || item.batch,
          expiry: batchExpiry || item.expiry,
          unitType: item.unitType || 'strip',
          quantity: item.quantity,
          tabletsPerStrip: item.tabletsPerStrip || 1,
          stripsPerBox: item.stripsPerBox || 1,
          gstPercent,
          gstAmount,
          quantityStrips: qty,
          unitPrice,
          stripPrice: item.stripPrice || item.unitPrice,
          discountPercentage: item.discountPercentage || 0,
          lineTotal,
          notes: item.notes,
        };

        const invoiceItem = new InvoiceItem(invoiceItemData);
        await invoiceItem.save();

        // Update inventory item (reduce total quantity)
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
