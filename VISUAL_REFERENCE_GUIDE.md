# Visual Quick Reference - Unified Add Stock Modal

## 🎨 UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ 📦 Add Stock                                          ✕  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [📦 Quick][📋 Detailed][🔖 Batch]  ← Tab Headers    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ℹ️ Quick Entry for uniform cartons                     │
│                                                          │
│  ┌─────────────────────────────────────────┐           │
│  │ 💚 2500 Total Strips                    │           │
│  └─────────────────────────────────────────┘           │
│                                                          │
│  Number of Cartons *        ┌─────────┐               │
│                            │    5    │               │
│                            └─────────┘               │
│                                                          │
│  Boxes per Carton *         ┌─────────┐               │
│                            │   10    │               │
│                            └─────────┘               │
│                                                          │
│  Strips per Box *           ┌─────────┐               │
│                            │   50    │               │
│                            └─────────┘               │
│                                                          │
│  Purchase Price per Carton  ┌─────────┐               │
│                            │ 2500.00 │               │
│                            └─────────┘               │
│                                                          │
│  Expiration Date *          ┌─────────────┐           │
│                            │01/01/2027  │           │
│                            └─────────────┘           │
│                                                          │
│  [✅ Add Stock]  [Cancel]                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 📊 Tab Comparison

```
┌─────────────────┬──────────────────────┬────────────────────┐
│  QUICK ENTRY    │  DETAILED ENTRY      │  BATCH ENTRY       │
├─────────────────┼──────────────────────┼────────────────────┤
│                 │                      │                    │
│ 🎯 Best For:    │ 🎯 Best For:         │ 🎯 Best For:       │
│ • Fast entry    │ • Custom mixes       │ • FIFO tracking    │
│ • Uniform       │ • Different sizes    │ • Auto-priority    │
│ • Bulk stock    │ • Special cases      │ • Expiry mgmt      │
│                 │                      │                    │
├─────────────────┼──────────────────────┼────────────────────┤
│                 │                      │                    │
│ 📝 Inputs:      │ 📝 Inputs:           │ 📝 Inputs:         │
│ • # Cartons     │ • Carton #           │ • Batch #          │
│ • Boxes/Carton  │ • Individual boxes   │ • Quantity         │
│ • Strips/Box    │ • Expiry             │ • Expiry           │
│ • Price/Carton  │ • Prices             │ • Cost/Unit        │
│ • Expiry        │                      │                    │
│                 │                      │                    │
├─────────────────┼──────────────────────┼────────────────────┤
│                 │                      │                    │
│ ✨ Result:      │ ✨ Result:           │ ✨ Result:         │
│ 5 × 10 × 50     │ 1 custom carton      │ Batch created      │
│ = 2500 strips   │ = 425 strips         │ = 2000 strips      │
│                 │                      │                    │
│ Multiple        │ One advanced         │ Used in invoices   │
│ uniform cartons │ carton               │ for auto-select    │
│                 │                      │                    │
└─────────────────┴──────────────────────┴────────────────────┘
```

## 🔄 Data Flow

```
USER ACTION
    │
    └──→ Click "Add Stock" Button
         │
         └──→ AddStockModal Opens
              │
              ├─ Tab 1: Quick Entry
              │  │
              │  ├─ Input: numberOfCartoons, boxes, strips
              │  │
              │  └─ Submit
              │     │
              │     └─ POST /api/inventory/{id}/cartons
              │        (Multiple times = Multiple cartons)
              │
              ├─ Tab 2: Detailed Entry  
              │  │
              │  ├─ Input: Carton #, boxes with individual strips
              │  │
              │  └─ Submit
              │     │
              │     ├─ POST /api/inventory/{id}/cartons
              │     │
              │     └─ POST /api/inventory/{id}/cartons/{id}/boxes
              │        (Multiple times = Multiple boxes)
              │
              └─ Tab 3: Batch Entry
                 │
                 ├─ Input: Batch #, qty, expiry, cost
                 │
                 └─ Submit
                    │
                    └─ POST /api/stock-batches
                       │
                       └─ Batch created for FIFO
```

## 🎨 Color Scheme

```
Tab Headers:
  🔵 Blue = Quick Entry       (Primary action)
  🟣 Purple = Detailed Entry   (Secondary action)
  🟠 Amber = Batch Entry       (Advanced action)

Status Colors (In Batch Management):
  🟢 Green = Active             (Normal operation)
  🟡 Yellow = Expiring Soon     (< 30 days alert)
  🔴 Red = Expired              (Past expiry)
  ⚪ Gray = Exhausted           (All sold out)

Text Colors:
  💙 Blue = Headers & Links
  🔴 Red = Errors & Warnings
  💚 Green = Success & Submit buttons
  ⚫ Black = Regular text
```

## 🏗️ Component Structure

```
InventoryManagement.tsx
│
├─ State: showCartonModal, selectedItemId
│
└─ Render:
   │
   └─ [...existing inventory table...]
      │
      └─ When medicine expanded:
         │
         ├─ Stock Cartons section
         │  └─ "Add Stock" Button
         │     │
         │     └─ onClick: setShowCartonModal(true)
         │
         ├─ Batch Management section
         │  └─ Batch table
         │
         └─ AddStockModal Component
            │
            ├─ Props:
            │  ├─ isOpen={showCartonModal}
            │  ├─ itemId={selectedItemId}
            │  ├─ itemName={...}
            │  ├─ itemLocation={...}
            │  ├─ defaultExpiryDate={...}
            │  ├─ onClose={() => setShowCartonModal(false)}
            │  └─ onSuccess={() => fetchCartons(...)}
            │
            └─ Tabs:
               ├─ Tab 1: Quick Entry Form + handleQuickSubmit()
               ├─ Tab 2: Detailed Entry Form + handleDetailedSubmit()
               └─ Tab 3: Batch Entry Form + handleBatchSubmit()
```

## 📱 Responsive Design

```
Desktop (1280px+)
┌──────────────────────────────────┐
│ Input Fields in Grid Layout      │
│ Multiple columns side by side     │
│ Full form visibility             │
│ Comfortable spacing              │
└──────────────────────────────────┘

Tablet (768px - 1279px)
┌────────────────────┐
│ Input Fields in    │
│ 2-column layout    │
│ Adequate spacing   │
└────────────────────┘

Mobile (< 768px)
┌──────────┐
│ Single   │
│ column   │
│ stacked  │
│ inputs   │
└──────────┘
```

## 🔢 Total Strips Calculator Logic

```
QUICK ENTRY:
  totalStrips = numberOfCartoons × boxesPerCarton × stripsPerBox
  
  Example: 5 × 10 × 50 = 2500
           ↓   ↓    ↓
        Cartons Boxes Strips/Box

DETAILED ENTRY:
  totalStrips = SUM(all boxes.stripsPerBox)
  
  Example: Box1(50) + Box2(50) + Box3(100) + Box4(25) = 225

BATCH ENTRY:
  totalStrips = quantityReceived
  
  Example: 2000 (simple, direct)
```

## 🔐 Validation Rules

```
┌──────────────────────────────────────────┐
│ QUICK ENTRY VALIDATION                   │
├──────────────────────────────────────────┤
│ numberOfCartoons:        ≥ 1             │
│ numberOfBoxesPerCarton:  ≥ 1             │
│ stripsPerBox:            ≥ 1             │
│ expirationDate:          Required        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ DETAILED ENTRY VALIDATION                │
├──────────────────────────────────────────┤
│ cartonNumber:            Not empty       │
│ Each box stripsPerBox:   ≥ 1             │
│ expirationDate:          Required        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ BATCH ENTRY VALIDATION                   │
├──────────────────────────────────────────┤
│ batchNumber:             Not empty       │
│ quantityReceived:        ≥ 1             │
│ costPerUnit:             > 0             │
│ expiryDate:              Required        │
└──────────────────────────────────────────┘
```

## 🚦 State Management

```
AddStockModal State:

activeTab: 'quick' | 'detailed' | 'batch'
  └─ Which tab is currently visible

quickData: {
  numberOfCartoons: number
  numberOfBoxesPerCarton: number
  stripsPerBox: number
  purchasePrice: number
  expirationDate: string
}

detailedData: {
  cartonNumber: string
  boxes: [{ boxNumber, stripsPerBox, purchasePrice }]
  expirationDate: string
}

batchData: {
  batchNumber: string
  receivedDate: string
  expiryDate: string
  quantityReceived: string
  costPerUnit: string
}

loading: boolean
  └─ Shows during API call
```

## 📈 Event Flow

```
User opens modal
    ↓
Selects tab (Quick/Detailed/Batch)
    ↓
Fills form fields
    ↓
Total calculator updates live
    ↓
Clicks submit button
    ↓
Validation check
    ├─ Fails: Show error message → User corrects
    └─ Passes: Continue...
    ↓
Loading state = true
    ↓
API call to backend
    ├─ Success: onSuccess() → Refresh UI
    └─ Error: Show error message → User retries
    ↓
Loading state = false
    ↓
Modal closes (or stays open for retry)
    ↓
Data visible in Stock Management/Batch Management
```

## 🎯 Quick Decision Tree

```
Need to add stock?
│
├─ All cartons identical?
│  ├─ YES → Use 📦 QUICK ENTRY
│  │         (Fast, ~30 seconds)
│  │
│  └─ NO → Use 📋 DETAILED ENTRY
│           (Custom, ~1 minute)
│
└─ Want FIFO automatic prioritization?
   ├─ YES → Use 🔖 BATCH ENTRY
   │         (Recommended, ~45 seconds)
   │
   └─ NO → Use Quick or Detailed
```

## 💾 What Gets Saved

```
QUICK ENTRY CREATES:
  ├─ StockCarton (×numberOfCartoons)
  │  └─ cartonNumber: "C{timestamp}-{i}"
  │     quantityOfBoxes: numberOfBoxesPerCarton
  │     purchasePrice: purchasePrice
  │     expirationDate: expirationDate
  │
  └─ StockBox (×numberOfCartoons × numberOfBoxesPerCarton)
     └─ boxNumber: 1-N
        stripsPerBox: stripsPerBox
        totalStrips: stripsPerBox
        availableStrips: stripsPerBox

BATCH ENTRY CREATES:
  └─ StockBatch (×1)
     └─ itemId: selected medicine
        batchNumber: batchNumber
        receivedDate: receivedDate
        expiryDate: expiryDate
        quantityReceived: quantityReceived
        quantityAvailable: quantityReceived
        quantitySold: 0
        costPerUnit: costPerUnit
        location: itemLocation
```

## 🎓 Common Use Cases

```
📦 QUICK ENTRY
├─ Receive 5 identical cartons from supplier
├─ All have 10 boxes, 50 strips each
└─ Result: Quick entry, 2500 total strips

📋 DETAILED ENTRY
├─ Receive special order with mixed boxes
├─ Some boxes 50 strips, others 100 strips
└─ Result: One custom carton, tracked individually

🔖 BATCH ENTRY
├─ Receive medicine batch for FIFO tracking
├─ 2000 strips, expires 01/01/2027
└─ Result: Auto-selected first in invoices
```

---

**Version:** 2.0 (Unified Modal)  
**Last Updated:** 2025-06-18  
**Component:** AddStockModal.tsx + InventoryManagement.tsx
