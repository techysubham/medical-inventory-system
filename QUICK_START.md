# Medical Inventory Management System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js installed
- MongoDB Atlas account & connection string
- Git

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd project
npm install
```

### Step 2: Configure Environment

**Backend (`backend/.env`):**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/medical?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (`project/.env`):**
```
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Should see: "Server running on http://localhost:5000"

**Terminal 2 - Frontend:**
```bash
cd project
npm run dev
```
✅ Should see: "Local: http://localhost:5173"

### Step 4: Create Super Admin

**Terminal 3:**
```bash
cd backend
node setup-superadmin.js
```
✅ Super admin user created: admin / admin111

### Step 5: Login & Test

1. Open browser: http://localhost:5173
2. Login with: admin / admin111
3. Click "Dashboard" to verify
4. Try adding a medicine in "Inventory"

---

## 📚 First Steps

### Add Your First Medicine

1. Navigate to **Inventory Management**
2. Click **"Add Medicine"**
3. Fill in:
   ```
   SKU: ASP-500-001
   Name: Aspirin 500mg
   Category: Pain Relief
   Purchase Price: ₹2.00
   Selling Price: ₹5.00
   ```
4. Click **"Add"**

### Add a Carton

1. In Inventory list, click **expand (▼)** for your medicine
2. Click **"Add Carton"**
3. Fill in:
   ```
   Carton Number: CAR-001
   Number of Boxes: 10
   Strips per Box: 100
   Purchase Price: ₹2000
   ```
4. Click **"Add Carton"**
5. System auto-calculates: 10 × 100 = **1000 total strips**

### Create Discount Tier

1. Navigate to **Discounts**
2. Click **"Create Discount"**
3. Fill in:
   ```
   Name: Bulk Buy
   Discount %: 10
   Color: Select color
   Active: Yes
   ```
4. Click **"Create"**

### Search with Discounts

1. Navigate to **Medicine Search**
2. Type medicine name "Aspirin"
3. See:
   ```
   Original Price: ₹5.00
   With 10% OFF: ₹4.50 (Save ₹0.50)
   ```

### Create Purchase Order

1. Navigate to **Purchase Orders**
2. Click **"Create Order"**
3. Select supplier (create one first if needed)
4. Add items and quantities
5. Set due date
6. Click **"Create"**

---

## 🔑 Key Concepts

### Stock Hierarchy
```
Medicine
  └─ Carton (e.g., "Carton 1000 strips")
      └─ Boxes (e.g., "10 boxes of 100 strips")
          └─ Strips (e.g., "1000 total strips")
```

### Pricing
```
Cost Price: ₹2.00/strip (what you pay)
Selling Price: ₹5.00/strip (what customer pays)
Profit: ₹3.00 (150% margin)
```

### Discounts
```
Discount: 10%
Discounted Price: ₹5.00 × 0.90 = ₹4.50
Customer Saves: ₹0.50
```

---

## 👥 User Roles & Permissions

### Super Admin
```
✓ Create/Edit/Delete medicines
✓ Manage suppliers & orders
✓ Create invoices & discounts
✓ View all reports
✓ User management
✓ System settings
```

### Admin
```
✓ Inventory management
✓ Supplier management
✓ Purchase orders
✓ Invoice creation
✓ Discount management
✓ View reports
```

### Manager
```
✓ View medicines
✓ Create orders
✓ View invoices
✓ Search medicines
```

### Staff
```
✓ View medicines
✓ Search & view discounts
```

---

## 🐛 Troubleshooting

### "Failed to save" Error
```
Solution: Restart backend server
cd backend && npm run dev
```

### Discounts not showing
```
Solution: Create discount tier first in Discounts menu
```

### Port already in use
```
# Backend on different port
PORT=5001 npm run dev

# Frontend on different port
npm run dev -- --port 5174
```

### MongoDB connection error
```
Solution: Check MONGODB_URI in .env
- Verify connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure MongoDB is running
```

---

## 📊 Common Tasks

| Task | Steps | Time |
|------|-------|------|
| Add medicine | Inventory → Add → Fill → Save | 1 min |
| Add carton | Expand medicine → Add Carton → Fill | 2 min |
| Create order | Purchase Orders → Create → Select supplier | 2 min |
| Add supplier | Suppliers → Add → Fill details | 1 min |
| Create discount | Discounts → Create → Set % → Save | 1 min |
| View reports | Reports → See dashboard stats | 1 min |

---

## 🎯 Next Steps

1. **Create test data:**
   - Add 5-10 medicines
   - Add 2-3 cartons per medicine
   - Create discount tiers

2. **Invite team members:**
   - User Management → Create Users
   - Assign roles (manager, staff)

3. **Configure settings:**
   - Settings → Set app name, currency, tax rate

4. **Set up alerts:**
   - Low stock threshold
   - Expiry warning days

5. **Train team:**
   - Share documentation
   - Demo key features
   - Practice operations

---

## 📞 Support Resources

- **User Guide:** See `MEDICAL_INVENTORY_GUIDE.md`
- **Technical Docs:** See `TECHNICAL_REFERENCE.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist: Initial Setup

- [ ] Node.js installed & npm working
- [ ] MongoDB Atlas account created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] .env files configured (backend & frontend)
- [ ] Backend server running on localhost:5000
- [ ] Frontend server running on localhost:5173
- [ ] Super admin created (admin/admin111)
- [ ] Login successful
- [ ] Can see Dashboard
- [ ] Can add a medicine
- [ ] Can add a carton
- [ ] Can create discount
- [ ] Can search medicines with discounts

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Web application |
| Backend API | http://localhost:5000/api | REST API |
| Health Check | http://localhost:5000/health | Check server status |
| MongoDB | MongoDB Atlas Dashboard | Database management |

---

**Ready to go!** 🎉

Start with small tasks and gradually explore advanced features. Refer to full documentation for detailed explanations.
