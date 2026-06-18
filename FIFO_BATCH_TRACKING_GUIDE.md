# FIFO Batch Tracking System - Implementation Guide

## Overview
This document explains the **FIFO (First In, First Out) batch tracking system** implemented for your Medical Store Inventory system. This system allows you to track multiple consignments of the same medicine with different expiry dates and automatically prioritize selling older stock first.

## Problem Solved
- **Multiple Consignments**: Track different batches of the same medicine received on different dates
- **Different Expiry Dates**: Each consignment has its own expiry date
- **Automatic Prioritization**: System automatically sells the oldest/expiring-soonest batch first
- **Per-Medicine Basis**: Each medicine is tracked individually
- **Invoice Integration**: Batch information is automatically populated during invoice creation

## Architecture

### Backend Components

#### 1. **StockBatch Model** (`backend/src/models/StockBatch.js`)
Tracks individual batches/consignments of medicines.

**Fields:**
- `itemId`: Reference to the InventoryItem
- `batchNumber`: Unique batch identifier
- `receivedDate`: When the consignment was received
- `expiryDate`: Expiry date of this batch
- `quantityReceived`: Initial quantity received
- `quantityAvailable`: Current available quantity (decreases as items sell)
- `quantitySold`: Total quantity sold from this batch
- `costPerUnit`: Cost per unit for costing purposes
- `status`: active, exhausted, expired, or archived

**Key Methods:**
```javascript
batch.isExpired()                          // Check if batch is expired
batch.daysUntilExpiry()                    // Days remaining
StockBatch.getAvailableBatchesForItem()    // Get active batches (FIFO sorted)
StockBatch.allocateStock()                 // FIFO allocation algorithm
```

#### 2. **Stock Batch API Routes** (`backend/src/routes/stock-batches.js`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/stock-batches/item/:itemId` | Get all batches for an item |
| GET | `/stock-batches/available/:itemId` | Get available batches (for invoice creation) |
| POST | `/stock-batches` | Create new batch (receive stock) |
| PUT | `/stock-batches/:id` | Update batch details |
| POST | `/stock-batches/allocate` | Get FIFO allocation for a quantity |
| DELETE | `/stock-batches/:id` | Delete batch |

#### 3. **Enhanced Invoice Routes** (`backend/src/routes/invoices.js`)
When creating an invoice, the system:
1. Receives item ID and quantity
2. Calls `StockBatch.allocateStock()` to get FIFO allocation
3. Updates all allocated batches (quantityAvailable decreased, quantitySold increased)
4. Records batch info in the invoice item
5. Updates total inventory

### Frontend Components

#### 1. **BatchManagement Component** (`src/components/BatchManagement.tsx`)
Integrated into Inventory Management (shown when expanding an item).

**Features:**
- View all batches for a medicine
- Add new batches (receive consignments)
- Shows batch status with expiry warnings
- Displays batch quantity tracking
- Color-coded status indicators:
  - 🟢 Green: Active, sufficient stock
  - 🟡 Yellow: Expiring within 30 days
  - 🔴 Red: Expired
  - ⚪ Gray: Exhausted

#### 2. **Enhanced InvoiceGeneration Component** (`src/components/InvoiceGeneration.tsx`)
**Auto-Population Features:**
- When adding a medicine to an invoice, automatically fetches available batches
- Selects the FIFO batch (oldest/expiring-soonest)
- Pre-fills batch number and expiry date
- Shows warning if batch expires soon

## Workflow Example

### Scenario: Multiple Consignments of Aspirin

**Day 1: Receive first consignment**
```
Medicine: Aspirin 500mg
Batch Number: ASP-20250101-001
Received: 2000 strips
Expiry: 2027-01-01
Cost per unit: ₹2.00
```

**Day 30: Receive second consignment**
```
Medicine: Aspirin 500mg
Batch Number: ASP-20250130-001
Received: 2000 strips (restock)
Expiry: 2027-06-01
Cost per unit: ₹2.00
```

**Inventory shows:**
- Total: 4000 strips available
- Batches tab shows both consignments

**When creating invoice:**
- System automatically selects Batch ASP-20250101-001 (oldest)
- Invoice shows expiry 2027-01-01
- After selling 1000 strips:
  - Batch ASP-20250101-001: 1000 available, 1000 sold
  - Batch ASP-20250130-001: 2000 available, 0 sold

**When batch is exhausted:**
- Batch ASP-20250101-001: 0 available, 2000 sold → Status: "exhausted"
- Next sales use Batch ASP-20250130-001

## API Usage Examples

### Add a New Batch (Receive Stock)
```bash
POST /api/stock-batches
{
  "itemId": "65a1b2c3d4e5f6g7h8i9j0",
  "batchNumber": "ASPIRIN-20250618",
  "receivedDate": "2025-06-18",
  "expiryDate": "2027-06-18",
  "quantityReceived": 2000,
  "costPerUnit": 2.50,
  "location": "Shelf A",
  "notes": "Premium brand"
}
```

### Get Available Batches (for Invoice)
```bash
GET /api/stock-batches/available/65a1b2c3d4e5f6g7h8i9j0

Response:
[
  {
    "_id": "batch1",
    "batchNumber": "ASP-001",
    "expiryDate": "2027-01-01",
    "quantityAvailable": 1000,
    "daysUntilExpiry": 195
  },
  {
    "_id": "batch2",
    "batchNumber": "ASP-002",
    "expiryDate": "2027-06-01",
    "quantityAvailable": 2000,
    "daysUntilExpiry": 315
  }
]
```

### Create Invoice with FIFO
```bash
POST /api/invoices
{
  "customerName": "John Doe",
  "items": [
    {
      "itemId": "65a1b2c3d4e5f6g7h8i9j0",
      "quantityStrips": 500,
      "unitPrice": 5.00,
      "gstPercent": 5
    }
  ]
}

Response:
- Invoice automatically allocated 500 strips from Batch ASP-001
- Batch ASP-001: quantityAvailable reduced to 500, quantitySold increased to 500
- Invoice shows batch number and expiry from ASP-001
```

## Key Features

### 1. Automatic FIFO Prioritization
- Batches are sorted by: **expiryDate (ascending), then receivedDate (ascending)**
- This ensures oldest/expiring-soonest items are sold first
- No manual intervention needed

### 2. Real-Time Batch Tracking
- **quantityReceived**: Initial quantity when batch was received
- **quantityAvailable**: Current available quantity
- **quantitySold**: Total sold from this batch
- **Status**: Automatically updates (active → exhausted → archived)

### 3. Expiry Warnings
- Batches expiring within 30 days shown in yellow
- Expired batches shown in red
- System warns when adding expiring-soon batches

### 4. Per-Medicine Basis
- Each medicine maintains its own batch list
- Multiple medicines can have overlapping expiry dates
- System manages each independently

### 5. Complete Audit Trail
- Every sale records which batch was used
- Invoice items show exact batch number and expiry
- Can trace any sale back to its source batch
- Supports inventory reconciliation

## User Interface Workflow

### For Inventory Manager

#### 1. Receiving Stock
1. Go to **Inventory Management**
2. Click the ⬇️ arrow to expand a medicine
3. Scroll to **Batch Management** section
4. Click **Add New Batch**
5. Fill in:
   - Batch Number
   - Received Date (auto-filled to today)
   - Expiry Date
   - Quantity Received
   - Cost Per Unit
6. Click **Add Batch**
7. Batch appears in the table with status indicators

#### 2. Monitoring Batches
In the Batch Management table, you can see:
- **Batch #**: Unique identifier
- **Received**: When consignment arrived
- **Expiry**: When batch expires
- **Received**: Original quantity
- **Available**: Remaining quantity to sell
- **Sold**: Total quantity sold
- **Status**: Active/Expired/Exhausted with color coding

#### 3. Selling (Auto-FIFO)
1. Go to **Invoice Management**
2. Click **Create Invoice**
3. Select a medicine
4. Click **Add**
5. System automatically:
   - Fetches available batches
   - Selects the oldest batch (FIFO)
   - Pre-fills batch number and expiry
   - Shows warning if expiring soon
6. Adjust quantity and other details
7. Create invoice
8. Batch quantities automatically updated

## Database Schema

### StockBatch Collection
```javascript
{
  _id: ObjectId,
  itemId: ObjectId,           // ref: InventoryItem
  batchNumber: String,
  purchaseOrderId: ObjectId,
  supplierId: ObjectId,
  receivedDate: Date,
  expiryDate: Date,
  quantityReceived: Number,
  quantityAvailable: Number,
  quantitySold: Number,
  costPerUnit: Number,
  totalCost: Number,
  status: String,             // enum: active, exhausted, expired, archived
  location: String,
  storageConditions: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ Receive Consignment (Inventory Manager)             │
│ - Add Batch via BatchManagement component           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Create Batch  │
         │ StockBatch    │
         │ Document      │
         └───────┬───────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Update InventoryItem       │
    │ - currentQuantity += qty   │
    │ - expirationDate = latest  │
    └────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ Create Invoice (Sales Staff)        │
    │ - Select medicine                   │
    │ - System fetches available batches  │
    │ - Auto-selects FIFO batch          │
    └────────────┬───────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ FIFO Allocation Algorithm           │
    │ - Sort by expiryDate, receivedDate  │
    │ - Allocate requested qty from batches│
    └────────────┬───────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ Update Batches                      │
    │ - quantityAvailable -= allocated    │
    │ - quantitySold += allocated         │
    │ - Set exhausted if quantityAvail=0 │
    └────────────┬───────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │ Create InvoiceItem                  │
    │ - batch = allocated batch number    │
    │ - expiry = allocated batch expiry   │
    └────────────────────────────────────┘
```

## Batch Status Lifecycle

```
┌─────────┐
│ CREATED │
└────┬────┘
     │
     ▼
┌──────────┐
│  ACTIVE  │  (Available for sale)
└────┬─────┘
     │
     ├─── (qty sold equals qty received) ──→ ┌───────────┐
     │                                         │ EXHAUSTED │
     │                                         └───────────┘
     │
     └─── (expiry date passed) ──────────────→ ┌─────────┐
                                              │ EXPIRED │
                                              └─────────┘
```

## Best Practices

### 1. Batch Numbering Convention
Use a standard format:
- `MEDICINE-YYYYMMDD-NNN`
- Example: `ASPIRIN-20250618-001`
- This makes sorting and identification easier

### 2. Regular Monitoring
- Check **Batch Management** weekly for upcoming expirations
- Yellow-highlighted batches (< 30 days) need priority
- Plan sales accordingly

### 3. Cost Tracking
- Record accurate cost per unit for each batch
- Use for costing inventory value
- Track supplier price variations

### 4. Storage Organization
- Note storage location in batch details
- Group batches physically by expiry date
- Makes physical inventory easier

### 5. Incident Management
- If batch is found damaged/contaminated, mark as "archived"
- Delete doesn't work once used - set to archived instead
- Maintains audit trail

## Troubleshooting

### Q: System is not showing FIFO batches in invoice
**A:** 
1. Check if batches exist: Go to Inventory → Expand medicine → Check Batch Management
2. Ensure batches have expiryDate and status="active"
3. Check browser console for API errors
4. Restart browser if needed

### Q: Batch appears but quantity shows as 0
**A:** 
1. Batch is marked "exhausted" - all units were sold
2. Check "Sold" column to confirm
3. Next invoice will auto-select next batch

### Q: Expiry date not showing in invoice
**A:**
1. Batch record might not have expiryDate
2. Edit batch and add missing expiry date
3. For new invoices, FIFO will show correct expiry

### Q: Can't delete a batch
**A:**
1. If batch has sales (quantitySold > 0), use "Update" to change status to "archived" instead
2. Deletion only works for unused batches
3. Archiving maintains audit trail

## API Integration for Third-Party Systems

If integrating with purchase order system:

```javascript
// When PO is received
POST /api/stock-batches
{
  "itemId": poItem.medicineId,
  "batchNumber": poItem.batchNumber,
  "purchaseOrderId": po._id,
  "supplierId": po.supplierId,
  "receivedDate": new Date(),
  "expiryDate": poItem.expiryDate,
  "quantityReceived": poItem.quantity,
  "costPerUnit": poItem.unitCost
}
```

## Future Enhancements

1. **Batch Merging**: Combine partially used batches with same expiry
2. **Forecasting**: Predict when batches will expire
3. **Alert Triggers**: Automated notifications for expiring batches
4. **Reports**: Batch aging analysis, expiry forecasts
5. **Mobile App**: Scan batch barcodes for quick selection

## Support & Questions

If you encounter issues or need clarification:
1. Check this documentation first
2. Review console logs in browser DevTools
3. Check backend logs for API errors
4. Verify batch data in MongoDB

---

**System Version**: 1.0  
**Last Updated**: 2025-06-18
