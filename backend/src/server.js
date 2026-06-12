import express from 'express';
import mongoose from 'mongoose';
import dns from 'dns';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import inventoryRoutes from './routes/inventory.js';
import discountRoutes from './routes/discounts.js';
import invoiceRoutes from './routes/invoices.js';
import supplierRoutes from './routes/suppliers.js';
import purchaseOrderRoutes from './routes/purchase-orders.js';
import alertRoutes from './routes/alerts.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import { startScheduler } from './services/alertDetector.js';

dotenv.config();

// Use Google Public DNS to improve SRV/DNS resolution for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('DNS servers set to Google Public DNS: 8.8.8.8, 8.8.4.4');
} catch (err) {
  console.warn('Failed to set custom DNS servers:', err);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS with a dynamic allowlist. Accepts `FRONTEND_URL` and localhost.
// Normalize origins by stripping trailing slashes so values like
// 'https://example.vercel.app' and 'https://example.vercel.app/' match.
const rawAllowed = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
const normalize = (u) => (typeof u === 'string' ? u.replace(/\/+$|\/$/g, '') : u);
const allowedOrigins = Array.from(new Set(rawAllowed.map(normalize)));
console.log('Allowed CORS raw:', rawAllowed, 'normalized:', allowedOrigins);
app.use(
  cors({
    origin: (origin, callback) => {
      console.log('CORS check - incoming origin:', origin);
      console.log('CORS check - FRONTEND_URL env:', process.env.FRONTEND_URL);
      if (!origin) return callback(null, true); // allow server-to-server or curl requests
      const incoming = normalize(origin);
      if (allowedOrigins.includes(incoming)) return callback(null, true);
      console.error('CORS policy: Origin not allowed', { origin, incoming, allowedOrigins });
      callback(new Error('CORS policy: Origin not allowed'), false);
    },
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root info - return a brief message so the primary URL is not a 404
app.get('/', (req, res) => {
  res.json({
    message: 'Medical Inventory API',
    docs: '/api',
    health: '/health'
  });
});
// API index - returns available endpoints (helps Vercel probe `/api`)
app.get('/api', (req, res) => {
  res.json({
    message: 'Medical Inventory API',
    endpoints: [
      '/api/auth',
      '/api/inventory',
      '/api/discounts',
      '/api/invoices',
      '/api/suppliers',
      '/api/purchase-orders',
      '/api/alerts',
      '/api/reports',
      '/api/settings',
      '/health'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Start alert detector scheduler (daily by default)
  try {
    startScheduler();
  } catch (err) {
    console.error('Failed to start alert scheduler', err);
  }
});