# Medical Inventory Management System - Complete Guide

## Overview

This system implements a complete medical inventory management platform with a sophisticated stock hierarchy system that tracks medicines from carton level down to individual strips.

## Key Features

### 1. Stock Hierarchy System

The system uses a 3-tier hierarchy:

```
CARTON (Purchase Unit)
├── Box 1
│   ├── 100 Strips
│   └── Available: 100
├── Box 2
│   ├── 100 Strips
│   └── Available: 95
└── Box N
    ├── Strips
    └── Available: X
```

**Example:**
- You purchase 1 Carton of Aspirin 500mg
- Carton contains: 10 boxes
- Each box contains: 100 strips
- Total strips in carton: 1,000 strips

### 2. Pricing System

Every medicine has two prices:

```
Cost Price (Purchase Price):    ₹2.00/strip
Selling Price (Sale Price):      ₹5.00/strip
Profit Per Strip:                ₹3.00 (150% profit)
```

The system automatically calculates:
- Purchase cost: Cost Price × Number of Strips
- Selling revenue: Selling Price × Number of Strips
- Profit margin: (Selling Price - Cost Price) / Cost Price × 100%

### 3. Discount System

The system supports multiple discount tiers that can be applied to medicines:

**Available Discounts:**
- 5% OFF
- 10% OFF
- 15% OFF
- 20% OFF (Custom colors possible)

**How it works:**
When you search for medicine, you see:
- Original selling price
- Available discount tiers
- Discounted price for each tier
- Amount saved per strip

### 4. Smart Inventory Tracking

**Features:**
- Low stock alerts (configurable threshold)
- Expiration date tracking
- Batch/Lot number management
- Real-time stock calculations
- Prescription requirement flags

## How to Use

### Adding a New Medicine

1. Click "Add Medicine" button
2. Fill in required fields:
   - **SKU**: Unique identifier (e.g., ASP-500-001)
   - **Name**: Medicine name (e.g., Aspirin 500mg)
   - **Category**: Drug category (e.g., Pain Relief)
   - **Purchase Price**: Cost per strip/unit (e.g., ₹2.00)
   - **Selling Price**: Sale price per strip/unit (e.g., ₹5.00)
3. Optional: Add description, expiration date, prescription flag
4. Click "Add" to save

### Managing Stock with Cartons

1. In the Inventory list, click the **Expand (▼)** button for a medicine
2. Click **"Add Carton"** button
3. Fill in carton details:
   - **Carton Number**: Reference identifier (e.g., CAR-001)
   - **Number of Boxes**: How many boxes in this carton (e.g., 10)
   - **Strips per Box**: Strips in each box (e.g., 100)
   - **Purchase Price**: Total carton cost (e.g., ₹2000)
   - **Expiration Date**: When carton expires

4. System automatically calculates:
   - Total Strips = Number of Boxes × Strips per Box
   - Creates individual box entries with strip counts

**Example:**
```
Input:
- Carton Number: CAR-001
- Number of Boxes: 10
- Strips per Box: 100
- Purchase Price: ₹2000

System creates:
- Total: 1000 strips
- 10 boxes, each with 100 strips
- Cost per strip: ₹2000/1000 = ₹2.00
```

### Searching with Discount Notifications

1. Navigate to "Medicine Search"
2. Use search box to find medicines by:
   - Medicine name
   - SKU
   - Category
3. View results showing:
   - Medicine details (cost, price, stock)
   - Profit percentage
   - **Available Discounts** (at top)
   - **Discounted Prices** for each tier

**Discount Price Example:**
```
Original Price: ₹5.00
Available Discounts:
- 5% OFF  → ₹4.75 (Save ₹0.25)
- 10% OFF → ₹4.50 (Save ₹0.50)
- 15% OFF → ₹4.25 (Save ₹0.75)
```

### Creating Purchase Orders

1. Navigate to "Purchase Orders"
2. Click "Create Order"
3. Select supplier from list
4. Add items and quantities
5. Set delivery date
6. System tracks order status:
   - Pending
   - Confirmed
   - Delivered
   - Cancelled

### Managing Suppliers

1. Navigate to "Suppliers"
2. Click "Add Supplier"
3. Fill in supplier details:
   - Name
   - Email
   - Phone
   - Address
   - Payment terms
4. Rate supplier (0-5 stars)

### Discount Management (Admin)

1. Navigate to "Discounts"
2. Create discount tiers:
   - **Name**: Tier name (e.g., "Bulk Buy 5%")
   - **Discount Percentage**: 0-100%
   - **Color Code**: Visual identifier (auto-generates)
   - **Active**: Enable/disable the discount

**Usage:**
- Bulk Purchase Discount: 5%
- Senior Citizen Discount: 10%
- Pharmacy Partner Discount: 15%
- Seasonal Promotion: 20%

### Viewing Reports & Analytics

1. Navigate to "Reports"
2. View dashboard stats:
   - Total medicines
   - Active suppliers
   - Total invoices
   - Total revenue
3. Export inventory, low-stock, and expiring items reports

## Role-Based Access

### Super Admin
- Full access to all features
- User management
- Settings configuration
- Access to all reports

### Admin
- Inventory management
- Purchase orders
- Supplier management
- Invoice creation
- View reports

### Manager
- View inventory
- Create purchase orders
- View invoices
- Search medicines

### Staff
- View inventory only
- Search medicines
- View published discounts

## API Endpoints

### Inventory Management
- `GET /api/inventory` - List all medicines
- `POST /api/inventory` - Create medicine
- `PUT /api/inventory/:id` - Update medicine
- `DELETE /api/inventory/:id` - Delete medicine
- `GET /api/inventory/:itemId/cartons` - Get cartons for medicine
- `POST /api/inventory/:itemId/cartons` - Create carton
- `GET /api/inventory/cartons/:cartonId/boxes` - Get boxes in carton
- `POST /api/inventory/cartons/:cartonId/boxes` - Create box in carton

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Purchase Orders
- `GET /api/purchase-orders` - List orders
- `POST /api/purchase-orders` - Create order
- `PUT /api/purchase-orders/:id` - Update order
- `DELETE /api/purchase-orders/:id` - Delete order

### Discounts
- `GET /api/discounts/tiers` - List discount tiers
- `POST /api/discounts/tiers` - Create tier
- `PUT /api/discounts/tiers/:id` - Update tier
- `DELETE /api/discounts/tiers/:id` - Delete tier

### Reports
- `GET /api/reports/stats` - Dashboard statistics
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/low-stock` - Low stock items
- `GET /api/reports/expiring` - Expiring items

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id/read` - Mark as read

### Settings
- `GET /api/settings` - Get app settings
- `PUT /api/settings` - Update settings

## Best Practices

### 1. Stock Organization
- Use consistent carton numbering (e.g., CAR-2024-001)
- Record accurate box and strip counts
- Update stock regularly after sales

### 2. Pricing Strategy
- Set realistic cost prices based on supplier rates
- Calculate selling prices with profit margin (typically 40-80%)
- Review competitors' pricing periodically

### 3. Discount Management
- Don't overlap discount tiers (e.g., don't offer both 10% and 15% to same customer)
- Track discount redemption for sales analysis
- Seasonal discounts should be time-limited

### 4. Inventory Control
- Set low-stock thresholds based on consumption rate
- Review slow-moving items quarterly
- Maintain expiration date alerts

### 5. Supplier Management
- Maintain good relationships with trusted suppliers
- Track supplier reliability ratings
- Negotiate bulk discounts for high-volume items

## Common Tasks

### Task: Update Purchase Price for a Medicine
1. Open Inventory Management
2. Find medicine in list
3. Click Edit (pencil icon)
4. Update "Purchase Price (Cost)" field
5. Click "Update"

### Task: Check Profit Margin
1. View Inventory list
2. Look at "Profit %" column
3. Red = Loss, Green = Profit
4. Higher % = Better profit margin

### Task: Set Up Discounts for a Medicine
1. Create discount tier in "Discounts" section
2. Medicines automatically see available discounts
3. In "Medicine Search", view discounted prices
4. When invoicing, system shows available discounts

### Task: Low Stock Alert
1. Set reorder point in medicine settings
2. System alerts when stock drops below threshold
3. Create purchase order from "Purchase Orders"
4. Track delivery status

## Troubleshooting

**Q: Why am I seeing "Failed to save supplier"?**
A: Backend routes may not be registered. Restart backend server with `npm run dev`

**Q: Discounts not showing in Medicine Search?**
A: Create discount tiers first in "Discounts" section

**Q: Total strips not calculated automatically?**
A: Strips = Number of Boxes × Strips per Box. System shows total in modal.

**Q: Stock numbers seem wrong?**
A: Check carton entries. Each carton's boxes contribute to total strips.

## Future Enhancements

- [ ] Barcode/QR code scanning for faster data entry
- [ ] Automated reorder point calculations based on sales velocity
- [ ] Multi-location inventory tracking
- [ ] Integration with pharmacy POS system
- [ ] SMS/Email alerts for low stock and expiries
- [ ] Advanced analytics and forecasting
- [ ] Batch expiry tracking and disposal management

## Support

For issues or feature requests, contact the system administrator or review the API documentation at `/api/docs`.
