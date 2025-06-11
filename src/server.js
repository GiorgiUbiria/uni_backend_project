require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter, authLimiter, corsOptions, helmetConfig } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const supplierRoutes = require('./routes/suppliers');
const itemRoutes = require('./routes/items');

const app = express();

connectDB();

app.set('trust proxy', 1);

app.use(helmetConfig);
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(generalLimiter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/items', itemRoutes);

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Management Platform API',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'User login',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile',
        'GET /api/auth/users': 'Get all users (admin)',
        'DELETE /api/auth/users/:id': 'Delete user (admin)',
        'PATCH /api/auth/users/:id/toggle-status': 'Toggle user status (admin)'
      },
      categories: {
        'GET /api/categories': 'Get all categories',
        'GET /api/categories/tree': 'Get category tree',
        'GET /api/categories/root': 'Get root categories',
        'GET /api/categories/top': 'Get top categories',
        'GET /api/categories/:id': 'Get category by ID',
        'POST /api/categories': 'Create category (admin)',
        'PUT /api/categories/:id': 'Update category (admin)',
        'DELETE /api/categories/:id': 'Delete category (admin)'
      },
      suppliers: {
        'GET /api/suppliers': 'Get all suppliers',
        'GET /api/suppliers/stats': 'Get supplier statistics',
        'GET /api/suppliers/top': 'Get top suppliers',
        'GET /api/suppliers/by-rating': 'Get suppliers by rating',
        'GET /api/suppliers/by-location': 'Get suppliers by location',
        'GET /api/suppliers/:id': 'Get supplier by ID',
        'POST /api/suppliers': 'Create supplier (admin)',
        'PUT /api/suppliers/:id': 'Update supplier (admin)',
        'DELETE /api/suppliers/:id': 'Delete supplier (admin)',
        'PATCH /api/suppliers/:id/rating': 'Update supplier rating (admin)',
        'PATCH /api/suppliers/:id/toggle-status': 'Toggle supplier status (admin)'
      },
      items: {
        'GET /api/items': 'Get all items',
        'GET /api/items/summary': 'Get inventory summary',
        'GET /api/items/low-stock': 'Get low stock items',
        'GET /api/items/:id': 'Get item by ID',
        'POST /api/items': 'Create item (admin)'
      }
    }
  });
});

app.use(notFound);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}
📚 API Documentation: http://localhost:${PORT}/api
💚 Health Check: http://localhost:${PORT}/health
  `);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app; 