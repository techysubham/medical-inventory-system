# Unified Add Stock Modal - User Guide

## Overview

The **Add Stock Modal** is a unified dialog that combines **Carton Entry** and **Batch Entry** into one convenient interface with three tabbed options:

1. 📦 **Quick Entry** - Fast entry for uniform cartons
2. 📋 **Detailed Entry** - Custom configuration for mixed boxes
3. 🔖 **Batch Entry** - FIFO batch tracking for sales prioritization

## How to Access

1. Open **Inventory Management**
2. Find your medicine and click the **⬇️ down arrow** to expand
3. In the **Stock Management** section, click **"+ Add Stock"** button

The unified modal dialog will open with the three tabs.

---

## Tab 1: Quick Entry 📦

**Best for:** Adding uniform cartons where all boxes have the same strip count.

### Use Case
You received a delivery of 5 cartons, each with 10 boxes, each box has 50 strips. Use Quick Entry!

### Steps
1. Click the **📦 Quick Entry** tab
2. Fill in:
   - **Number of Cartons**: `5`
   - **Boxes per Carton**: `10`
   - **Strips per Box**: `50`
   - **Purchase Price per Carton**: `2500` (optional)
   - **Expiration Date**: `01/01/2027`

3. Watch the **Total Strips** counter update: `5 × 10 × 50 = 2500 strips`
4. Click **✅ Add Stock**

✨ **Result:** System creates 5 cartons with 50 boxes total (10 per carton), all with 50 strips per box.

---

## Tab 2: Detailed Entry 📋

**Best for:** Adding cartons where individual boxes have different strip counts.

### Use Case
You have 1 carton with mixed boxes: Box 1-3 have 50 strips, Box 4-6 have 100 strips, Box 7-10 have 25 strips. Use Detailed Entry!

### Steps
1. Click the **📋 Detailed Entry** tab
2. Fill in:
   - **Carton Number**: `CAR-20250618-001`
   - **Expiration Date**: `01/01/2027`

3. For each box:
   - Box 1: Strips = 50
   - Box 2: Strips = 50
   - Box 3: Strips = 50
   - Box 4: Strips = 100
   - ... and so on

4. Watch **Total Strips** update as you modify box counts
5. Click **+ Add Box** to add more boxes if needed
6. Click **✅ Add Carton**

💡 **Tip:** Use the "+ Add Box" button to add additional boxes beyond the first one.

✨ **Result:** System creates 1 carton with 10 individually tracked boxes, each with their own strip count.

---

## Tab 3: Batch Entry 🔖

**Best for:** Tracking complete batches for FIFO (First-In-First-Out) automatic prioritization during sales.

### Use Case
You want to track 2000 strips of Aspirin received on June 18 that expire on January 1, 2027. System should automatically sell these first. Use Batch Entry!

### Steps
1. Click the **🔖 Batch Entry** tab
2. Fill in:
   - **Batch Number**: `ASP-20250618-001`
   - **Received Date**: `06/18/2025` (auto-filled today)
   - **Expiry Date**: `01/01/2027`
   - **Quantity Received**: `2000` (strips)
   - **Cost Per Unit**: `2.50`

3. Click **✅ Add Batch**

🎯 **Result:** 
- Batch created with 2000 strips all marked available
- When creating invoices, this batch auto-selected first (oldest)
- System tracks: Received (2000) → Sold (increases as you invoice) → Available (decreases)
- When completely sold: Status changes to "Exhausted"

---

## Comparison: When to Use Each Tab

| Scenario | Tab | Why |
|----------|-----|-----|
| 5 cartons, 10 boxes each, 50 strips/box | Quick Entry | All uniform |
| 1 carton with mixed box sizes | Detailed Entry | Custom config needed |
| Receive medicine as complete batch | Batch Entry | FIFO tracking priority |
| Multiple consignments of same medicine | Batch Entry | Track separately by expiry |
| Need to track specific carton numbers | Detailed Entry | Full control |
| Fast stock entry | Quick Entry | Speed |

---

## Total Strips Calculator

All three tabs show a **live counter** of total strips:

```
Quick Entry:
5 Cartons × 10 Boxes × 50 Strips = 2500 Total Strips
                                    ▲ Updates live!

Detailed Entry:
Box 1: 50 + Box 2: 50 + Box 3: 50 ... = 2500 Total Strips
                                         ▲ Updates as you edit!

Batch Entry:
Quantity: 2000 = 2000 Total Strips
```

---

## Integration with Inventory System

### After Quick or Detailed Entry
- Stock appears in **Stock Cartons** section
- Each box tracked individually
- Quantity reflected in inventory total
- Can drill down to see box-level details

### After Batch Entry
- Batch appears in **Batch Management** section
- Auto-tracked for FIFO sales
- Expiry date shows with warning colors
- When creating invoices:
  - System auto-selects this batch (if oldest)
  - Batch quantity auto-updated as you sell
  - Invoice shows which batch was used

---

## Color-Coded Tab Headers

| Tab Color | Tab Name | Purpose |
|-----------|----------|---------|
| 🔵 Blue | Quick Entry | Fast uniform entry |
| 🟣 Purple | Detailed Entry | Custom mixed boxes |
| 🟠 Amber | Batch Entry | FIFO batch tracking |

---

## Advanced: Mixed Workflow

You can use different tabs for different scenarios on the same medicine:

**Example: Aspirin 500mg**

1. **Quick Entry**: Add 10 cartons of uniform stock from Supplier A
2. **Detailed Entry**: Add 1 special carton with mixed box sizes from Supplier B
3. **Batch Entry**: Track 500 strips in special promotional packaging

Result: All tracked separately, FIFO handles batches correctly when selling.

---

## Validation & Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Please fill all fields" | Missing required input | Check for red-highlighted fields |
| "Failed to create" | Server error | Verify network connection, try again |
| "Invalid date" | Expiry date in past | Use future date for expiry |
| 0 Total Strips | Zero in any field | Ensure all numbers are ≥ 1 |

---

## Best Practices

### 1. Batch Numbering
Use consistent format: `MED-YYYYMMDD-NNN`
- `ASP-20250618-001` ← Easy to identify
- `ASPIRIN-20250618-001` ← More descriptive
- `B001` ← Too generic

### 2. Expiry Date Accuracy
- Double-check expiry dates
- FIFO sorting depends on this
- Yellow warnings trigger at < 30 days

### 3. Cost Tracking
- Quick/Detailed: Per carton cost
- Batch: Per unit cost (for accurate costing)
- Use consistently for inventory valuation

### 4. Mixed Approach
- Use Batch Entry for FIFO-critical medicines
- Use Quick Entry for standard stocking
- Use Detailed Entry only when necessary

### 5. Regular Monitoring
- Check yellow-highlighted batches weekly
- Plan sales around expiry dates
- Archive expired batches

---

## Troubleshooting

### Q: After adding stock, why doesn't total inventory update immediately?
**A:** Refresh the page. The update should appear within a few seconds. If not, try:
1. Close and reopen the expanded medicine
2. Refresh the entire Inventory Management page
3. Check browser console for errors (F12)

### Q: Can I edit stock after adding it?
**A:** 
- **Cartons**: Currently can only add/delete (delete only if unused)
- **Batches**: Can update via Batch Management table (click edit icon)
- Better to delete and re-add if you made a mistake

### Q: What if I entered wrong expiry date in Batch?
**A:** 
1. Go to Batch Management section below Stock Cartons
2. Find the batch in the table
3. Click to edit and update expiry date
4. FIFO prioritization will recalculate

### Q: Can I have negative strips?
**A:** No, system prevents this:
- Can't add negative quantities
- Can't sell more than available
- Error message if you try

### Q: Which tab should I use for wholesale bulk?
**A:** Use **Batch Entry** - it's optimized for large quantities and FIFO tracking.

---

## Keyboard Shortcuts

- **Tab Key**: Move between fields
- **Enter**: (In some fields) Submit form
- **Escape**: Close modal without saving (on some systems)

---

## Data Flow Diagram

```
Add Stock Modal
    ↓
    ├─ Quick Entry → Create multiple uniform Cartons → Stock Cartons table
    │
    ├─ Detailed Entry → Create 1 mixed Carton → Stock Cartons table
    │
    └─ Batch Entry → Create Batch → Batch Management table
                                   ↓
                          Used for FIFO Sales
                          Auto-selected in invoices
```

---

## See Also

- [FIFO_BATCH_TRACKING_GUIDE.md](FIFO_BATCH_TRACKING_GUIDE.md) - Technical details
- [BATCH_QUICK_START.md](BATCH_QUICK_START.md) - Quick start guide
- [Inventory Management](./InventoryManagement.tsx) - Component code

---

**Updated**: 2025-06-18  
**Version**: 2.0 (Unified Add Stock Modal)
