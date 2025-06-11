const { connectDB, disconnectDB } = require('../src/config/database');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Supplier = require('../src/models/Supplier');
const Item = require('../src/models/Item');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';

before(async function() {
  this.timeout(10000);
  try {
    await connectDB();
    console.log('Test database connected');
  } catch (error) {
    console.error('Test database connection failed:', error);
    process.exit(1);
  }
});

afterEach(async function() {
  this.timeout(5000);
  try {
    await User.deleteMany({});
    await Category.deleteMany({});
    await Supplier.deleteMany({});
    await Item.deleteMany({});
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});

after(async function() {
  this.timeout(5000);
  try {
    await disconnectDB();
    console.log('Test database disconnected');
  } catch (error) {
    console.error('Test database disconnection failed:', error);
  }
});

module.exports = {
  createTestUser: async (userData = {}) => {
    const defaultUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    };
    return await User.create({ ...defaultUser, ...userData });
  },

  createTestAdmin: async (userData = {}) => {
    const defaultAdmin = {
      username: 'testadmin',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin'
    };
    return await User.create({ ...defaultAdmin, ...userData });
  },

  createTestCategory: async (userId, categoryData = {}) => {
    const defaultCategory = {
      name: 'Test Category',
      description: 'Test category description',
      createdBy: userId
    };
    return await Category.create({ ...defaultCategory, ...categoryData });
  },

  createTestSupplier: async (userId, supplierData = {}) => {
    const defaultSupplier = {
      name: 'Test Supplier',
      contactPerson: 'John Doe',
      email: 'supplier@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '12345',
        country: 'Test Country'
      },
      createdBy: userId
    };
    return await Supplier.create({ ...defaultSupplier, ...supplierData });
  },

  createTestItem: async (userId, categoryId, supplierId, itemData = {}) => {
    const defaultItem = {
      name: 'Test Item',
      description: 'Test item description',
      sku: 'TEST-ITEM-001',
      category: categoryId,
      supplier: supplierId,
      price: {
        cost: 50,
        selling: 100
      },
      stock: {
        quantity: 25,
        minQuantity: 5,
        maxQuantity: 100,
        location: {
          warehouse: 'Test Warehouse'
        }
      },
      createdBy: userId
    };
    return await Item.create({ ...defaultItem, ...itemData });
  }
}; 