# Medical Inventory Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application for managing pharmaceutical inventory with role-based access control, stock hierarchy, pricing, and invoicing.

## 📋 Features

- **Inventory Management**: Track medicines with carton, box, and strip-level organization
- **Supplier Management**: Manage suppliers and purchase orders
- **Pricing System**: Cost price and selling price with automatic profit calculation
- **Discount Tiers**: Multiple discount levels per medicine
- **Role-Based Access Control**: Super Admin, Manager, Staff roles with granular permissions
- **Alerts System**: Low stock and expiry alerts
- **Reports & Analytics**: Comprehensive business insights
- **Invoice Generation**: Create and manage invoices
- **Responsive UI**: Works on desktop and mobile devices

## 🏗️ Project Structure

```
.
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── server.js          # Main server entry point
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth and RBAC middleware
│   │   └── services/          # Business logic
│   └── package.json
├── src/                        # React + TypeScript frontend
│   ├── components/            # React components
│   ├── contexts/              # Context API for state
│   ├── App.tsx
│   └── main.tsx
├── package.json               # Frontend dependencies
└── vite.config.ts             # Vite build config
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Setup environment variables**
   
   Create `.env` in backend folder:
   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/medical-inventory
   JWT_SECRET=your-secure-secret-key
   PORT=5000
   NODE_ENV=development
   ```
   
   Create `.env.local` in root folder:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Run both servers**
   
   Terminal 1 - Backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

### Default Login Credentials
- **Email**: admin@example.com
- **Password**: admin123

## 🌐 Deployment

### Frontend - Vercel
1. Push code to GitHub
2. Connect repo to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=<your-backend-url>`

### Backend - Render
1. Push backend code to GitHub
2. Connect repo to Render
3. Set start command: `npm start`
4. Add environment variables:
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: Secure random string
   - `NODE_ENV`: production

### Database - MongoDB Atlas
1. Create free cluster at https://mongodb.com/cloud/atlas
2. Create database user
3. Get connection string
4. Use in backend `.env` as `MONGODB_URI`

## 📚 API Documentation

All endpoints require authentication via JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Core Endpoints
- `POST /api/auth/login` - User login
- `GET/POST /api/inventory/` - Inventory items
- `GET/POST /api/suppliers/` - Suppliers
- `GET/POST /api/purchase-orders/` - Purchase orders
- `GET /api/alerts/` - System alerts
- `GET /api/reports/` - Analytics data

See [backend/API_DOCS.md](backend/API_DOCS.md) for complete API reference.

## 🔐 Role-Based Permissions

**Super Admin**
- All permissions
- Can assign roles to users

**Manager**
- View/Manage inventory
- View/Manage suppliers
- View/Manage purchase orders
- Generate reports

**Staff**
- View inventory
- Create invoices
- View alerts

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS

**Backend:**
- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication

## 📝 Documentation

- [MEDICAL_INVENTORY_GUIDE.md](MEDICAL_INVENTORY_GUIDE.md) - User guide
- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [backend/API_DOCS.md](backend/API_DOCS.md) - API documentation

## 🐛 Troubleshooting

**Backend won't start:**
- Verify MongoDB connection string
- Check if port 5000 is available
- Restart the server

**API returns 404:**
- Verify backend is running
- Check `VITE_API_URL` in frontend
- Check route registration in backend

**Authentication fails:**
- Verify JWT_SECRET matches between requests
- Check token expiration
- Clear browser cookies and try again

## 📞 Support

For issues or questions, please create an issue in the GitHub repository.

## 📄 License

This project is open source and available under the MIT License.

---

**Version**: 1.0.0  
**Last Updated**: June 2026
