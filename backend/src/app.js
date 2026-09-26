const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const transferRoutes = require('./routes/transferRoutes');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StockSense API is running',
    data: {
      name: 'StockSense IMS Backend',
      version: '1.0.0',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OK',
    data: {},
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/ledger', ledgerRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;