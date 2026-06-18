# FIFO Batch System - Quick Start Guide

## 🎉 New: Unified Add Stock Modal

Your system now has an **integrated "Add Stock" dialog** that combines batch and carton entry in one place with **multiple tabs**:
- 📦 Quick Entry (for uniform cartons)
- 📋 Detailed Entry (for mixed boxes)  
- 🔖 Batch Entry (for FIFO tracking)

See [ADD_STOCK_MODAL_GUIDE.md](ADD_STOCK_MODAL_GUIDE.md) for detailed instructions on the new modal.

---

## What's New?

Your inventory system now tracks **multiple batches of the same medicine** with different expiry dates. When selling, it automatically prioritizes the **oldest stock first (FIFO)** - perfect for pharmaceutical inventory!

## Quick Setup (5 minutes)

### Step 1: Add Your First Batch
1. Open **Inventory Management**
2. Find a medicine (e.g., "Aspirin 500mg")
3. Click the **⬇️ down arrow** on the right
4. Click **"+ Add Stock"** button
5. The **Add Stock Modal** opens with 3 tabs
6. Click the **🔖 Batch Entry** tab
7. Fill in:
   - **Batch Number**: `ASP-20250618-001`
   - **Received Date**: Auto-filled (today)
   - **Expiry Date**: `01/01/2027`
   - **Quantity Received**: `2000`
   - **Cost Per Unit**: `2.50`
8. Click **✅ Add Batch**

✅ Your first batch is created!

**Tip:** See [ADD_STOCK_MODAL_GUIDE.md](ADD_STOCK_MODAL_GUIDE.md) for details on all three tabs (Quick/Detailed/Batch).

### Step 2: View Batches in a Table
After adding batches, they appear in the **Batch Management** section (scroll down below Stock Cartons) showing:
- ✅ Batch number
- 📅 Received & Expiry dates
- 📦 Quantity tracking (Received/Available/Sold)
- 💵 Cost information
- 🟢 Status indicator (green = active, yellow = expiring soon, red = expired)

### Step 3: Receive Another Consignment
1. Same medicine, click **+ Add Stock** again
2. Click **🔖 Batch Entry** tab
3. Different batch number: `ASP-20250625-001`
4. Different expiry: `01/07/2027`
5. Same or different quantity: `2500`
6. Click **✅ Add Batch**

💡 Now you have 2 batches! Total stock = 4500 strips

### Step 4: Create Invoice (Automatic FIFO)
1. Go to **Invoice Management**
2. Click **"Create Invoice"**
3. Enter customer name
4. **Select medicine** from dropdown
5. Click **"Add"**
6. ✨ **System automatically:**
   - Fetches both batches
   - Picks the OLDEST batch first: `ASP-20250618-001` (expires 01/01/2027)
   - Fills in batch number & expiry date
   - Shows warning if expiring soon
7. Enter quantity: `100`
8. Click **"Create Invoice"**

✅ **Result:**
- Batch `ASP-20250618-001`: **Available: 1900** (was 2000), **Sold: 100**
- Batch `ASP-20250625-001`: **Available: 2500**, **Sold: 0**
- Invoice shows: **Batch: ASP-20250618-001, Expiry: 01/01/2027**

### Step 5: Keep Selling (FIFO Continues)
Next invoice of the same medicine:
- System again picks `ASP-20250618-001`
- When it reaches 0 available → status becomes **"Exhausted"**
- Next sale automatically uses `ASP-20250625-001`

## Color Codes Explained

| Color | Meaning | Action |
|-------|---------|--------|
| 🟢 Green | Active & plenty of time | Normal sales |
| 🟡 Yellow | Expires in < 30 days | Prioritize for sale |
| 🔴 Red | Already expired | Don't sell, archive |
| ⚪ Gray | All sold out | Only historical record |

## Real Example: Medicine Shop Daily Routine

**Morning:**
- Open Inventory Management
- Check for **yellow batches** (expiring soon)
- Plan to sell these first today

**Customer buys medicine:**
- Create invoice → Add medicine → System shows **oldest batch** automatically
- Batch and expiry auto-filled
- Complete sale

**Month-end stock check:**
- Open Inventory Management
- Expand each medicine
- See all batches: How many received, sold, and available
- Physical count matches digital records ✅

## Common Questions

### Q: Why did the system pick a different batch?
**A:** It picks the **expiring-soonest batch first**. Even if a newer batch was received later, if it expires sooner, it gets priority.

### Q: Can I manually choose which batch to sell?
**A:** Yes! In the invoice form, you can edit the batch & expiry fields if you need to override FIFO.

### Q: What if a batch expires?
**A:** The batch status shows **red** and says "Expired". Don't create invoices with expired batches - system will warn you.

### Q: How many batches can one medicine have?
**A:** Unlimited! Each consignment gets its own batch record. System manages all automatically.

### Q: Can I see which batch was sold in an old invoice?
**A:** Yes! Open any invoice and it shows **batch number and expiry** for each item.

### Q: What if I made a mistake entering batch details?
**A:** In Batch Management table, each batch shows a trash icon 🗑️. Click it to delete (only works if batch has 0 sales).

## Key Metrics You Can Now Track

✅ **Batch Aging**: See exactly how old each batch is  
✅ **Expiry Forecasting**: Know when batches will expire  
✅ **Stock Traceability**: Which batch was in which invoice  
✅ **Waste Reduction**: No expired stock sold  
✅ **Cost Analysis**: Cost per unit by batch  
✅ **Supplier Performance**: Which supplier's batches sell first  

## System Architecture (Non-Technical Overview)

```
YOUR MEDICINE:
├─ Batch 1 (Received Jan 2025)
│   ├─ Expiry: Jan 2027
│   ├─ Received: 2000 strips
│   ├─ Sold: 500 strips
│   └─ Available: 1500 strips ← System picks THIS for next sale
│
└─ Batch 2 (Received June 2025)
    ├─ Expiry: June 2027
    ├─ Received: 2500 strips
    ├─ Sold: 0 strips
    └─ Available: 2500 strips ← Picked AFTER Batch 1 is done
```

## Troubleshooting

**Batch Management tab not showing?**
- Click the ⬇️ arrow to expand the medicine
- Scroll down - it's below the cartons section

**Batch not showing in invoice auto-fill?**
- Make sure batch status is **"Active"** (green)
- Make sure expiry date is in future
- Make sure it has available quantity > 0

**Numbers not adding up?**
- Received - Sold = Available
- Total of all batches = Total inventory quantity
- Refresh page if numbers seem wrong

## Tips for Success

1. **Use consistent batch numbering**: Like `MED-YYYYMMDD-###`
2. **Enter expiry dates accurately**: This determines FIFO order
3. **Check yellow batches weekly**: Plan to sell before expiry
4. **Use batch tracking for audits**: Proves you sold oldest stock first
5. **Monitor supplier batches**: See if batches from one supplier expire sooner

## Next Steps

- ✅ Add batches for all medicines currently in stock
- ✅ Create invoices as normal - FIFO happens automatically
- ✅ Check Batch Management weekly for expiring stock
- ✅ Refer to [FIFO_BATCH_TRACKING_GUIDE.md](FIFO_BATCH_TRACKING_GUIDE.md) for detailed docs

## Questions?

Refer to the complete guide: [FIFO_BATCH_TRACKING_GUIDE.md](FIFO_BATCH_TRACKING_GUIDE.md)

---

**Happy Selling! Your inventory is now FIFO-compliant! 🎉**
