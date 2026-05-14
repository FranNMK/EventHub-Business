const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import custom modules
const { testConnection, initializeDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// IMPORT ALL ROUTES
// ============================================
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const vendorRoutes = require('./routes/vendors');
const serviceRoutes = require('./routes/services');
const reportRoutes = require('./routes/reports');

// ============================================
// API ROUTES - MUST be before 404 handler
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EventHub Business API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Event routes
app.use('/api/events', eventRoutes);

// Registration routes
app.use('/api/registrations', registrationRoutes);

// Vendor routes
app.use('/api/vendors', vendorRoutes);

// Service routes
app.use('/api/services', serviceRoutes);

// ============================================
// 404 HANDLER - MUST be after all routes
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});


app.use('/api/reports', reportRoutes);
// ============================================
// GLOBAL ERROR HANDLER - MUST be last
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
  try {
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Could not connect to database. Please check your configuration.');
      process.exit(1);
    }

    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`✅ ${process.env.APP_NAME || 'EventHub Business'} server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📋 API Routes:`);
      console.log(`   - POST /api/auth/register`);
      console.log(`   - POST /api/auth/login`);
      console.log(`   - GET  /api/events`);
      console.log(`   - POST /api/events`);
      console.log(`   - GET  /api/vendors`);
      console.log(`   - POST /api/vendors/register`);
      console.log(`   - GET  /api/services`);
      console.log(`   - POST /api/services`);
      console.log(`   - GET  /api/registrations`);
      console.log(`   - POST /api/registrations`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

startServer();

module.exports = app;