import mongoose from 'mongoose';

const stockBatchSchema = new mongoose.Schema(
  {
    itemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'InventoryItem', 
      required: true 
    },
    batchNumber: { 
      type: String, 
      required: true 
    },
    purchaseOrderId: mongoose.Schema.Types.ObjectId,
    supplierId: mongoose.Schema.Types.ObjectId,
    
    // Batch Details
    receivedDate: { 
      type: Date, 
      default: Date.now,
      required: true 
    },
    expiryDate: { 
      type: Date, 
      required: true 
    },
    
    // Quantity Tracking
    quantityReceived: { 
      type: Number, 
      required: true 
    },
    quantityAvailable: { 
      type: Number, 
      required: true 
    },
    quantitySold: { 
      type: Number, 
      default: 0 
    },
    
    // Cost Information
    costPerUnit: { 
      type: Number, 
      required: true 
    },
    totalCost: { 
      type: Number, 
      required: true 
    },
    
    // Status
    status: { 
      type: String, 
      enum: ['active', 'exhausted', 'expired', 'archived'], 
      default: 'active' 
    },
    
    // Storage Info
    location: String,
    storageConditions: String,
    
    // Notes
    notes: String,
  },
  { 
    timestamps: true,
    indexes: [
      { itemId: 1, status: 1 }, // For quick lookup of active batches
      { expiryDate: 1 }, // For checking expiry
      { receivedDate: 1 } // For FIFO ordering
    ]
  }
);

// Method to check if batch is expired
stockBatchSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to get days until expiry
stockBatchSchema.methods.daysUntilExpiry = function() {
  const now = new Date();
  const diff = this.expiryDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Static method to get available batches for an item in FIFO order (oldest first)
stockBatchSchema.statics.getAvailableBatchesForItem = async function(itemId, excludeExpired = true) {
  const query = {
    itemId: itemId,
    status: 'active',
    quantityAvailable: { $gt: 0 }
  };

  if (excludeExpired) {
    query.expiryDate = { $gt: new Date() };
  }

  return this.find(query)
    .sort({ expiryDate: 1, receivedDate: 1 }) // Oldest expiry first, then oldest received first
    .exec();
};

// Static method to allocate stock from batches (FIFO)
stockBatchSchema.statics.allocateStock = async function(itemId, quantityNeeded) {
  const batches = await this.getAvailableBatchesForItem(itemId);
  
  if (!batches.length) {
    throw new Error(`No available stock for item ${itemId}`);
  }

  const allocated = [];
  let remaining = quantityNeeded;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const qtyToAllocate = Math.min(remaining, batch.quantityAvailable);
    
    allocated.push({
      batchId: batch._id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantityAllocated: qtyToAllocate,
      costPerUnit: batch.costPerUnit,
      totalCost: qtyToAllocate * batch.costPerUnit
    });

    remaining -= qtyToAllocate;
  }

  if (remaining > 0) {
    throw new Error(`Insufficient stock. Only ${quantityNeeded - remaining} available of ${quantityNeeded} requested`);
  }

  return allocated;
};

export default mongoose.model('StockBatch', stockBatchSchema);
