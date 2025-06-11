require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Item = require('../models/Item');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Supplier.deleteMany({});
    await Item.deleteMany({});

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@inventory.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    // Create regular user
    const regularUser = await User.create({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user'
    });

    console.log('📂 Creating categories...');
    // Create root categories
    const electronicsCategory = await Category.create({
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      createdBy: adminUser._id
    });

    const clothingCategory = await Category.create({
      name: 'Clothing',
      description: 'Apparel and fashion items',
      createdBy: adminUser._id
    });

    const booksCategory = await Category.create({
      name: 'Books',
      description: 'Books and educational materials',
      createdBy: adminUser._id
    });

    // Create subcategories
    const laptopsCategory = await Category.create({
      name: 'Laptops',
      description: 'Laptop computers and accessories',
      parentCategory: electronicsCategory._id,
      createdBy: adminUser._id
    });

    const smartphonesCategory = await Category.create({
      name: 'Smartphones',
      description: 'Mobile phones and accessories',
      parentCategory: electronicsCategory._id,
      createdBy: adminUser._id
    });

    const mensClothingCategory = await Category.create({
      name: 'Men\'s Clothing',
      description: 'Clothing items for men',
      parentCategory: clothingCategory._id,
      createdBy: adminUser._id
    });

    console.log('🏢 Creating suppliers...');
    const suppliers = await Supplier.create([
      {
        name: 'TechCorp Solutions',
        contactPerson: 'Michael Johnson',
        email: 'contact@techcorp.com',
        phone: '+1234567890',
        address: {
          street: '123 Tech Street',
          city: 'San Francisco',
          state: 'California',
          postalCode: '94105',
          country: 'USA'
        },
        website: 'https://techcorp.com',
        paymentTerms: 'Net 30',
        rating: 4.5,
        createdBy: adminUser._id
      },
      {
        name: 'Global Electronics Ltd',
        contactPerson: 'Sarah Davis',
        email: 'orders@globalelectronics.com',
        phone: '+1987654321',
        address: {
          street: '456 Electronics Ave',
          city: 'Austin',
          state: 'Texas',
          postalCode: '73301',
          country: 'USA'
        },
        paymentTerms: 'Net 60',
        rating: 4.2,
        createdBy: adminUser._id
      },
      {
        name: 'Fashion Forward Inc',
        contactPerson: 'Emma Wilson',
        email: 'sales@fashionforward.com',
        phone: '+1555666777',
        address: {
          street: '789 Fashion Blvd',
          city: 'New York',
          state: 'New York',
          postalCode: '10001',
          country: 'USA'
        },
        paymentTerms: 'Net 30',
        rating: 4.8,
        createdBy: adminUser._id
      },
      {
        name: 'BookWorld Publishers',
        contactPerson: 'David Chen',
        email: 'orders@bookworld.com',
        phone: '+1444333222',
        address: {
          street: '321 Library Lane',
          city: 'Chicago',
          state: 'Illinois',
          postalCode: '60601',
          country: 'USA'
        },
        paymentTerms: 'Net 45',
        rating: 4.0,
        createdBy: adminUser._id
      }
    ]);

    console.log('📦 Creating inventory items...');
    const items = await Item.create([
      {
        name: 'MacBook Pro 16"',
        description: 'High-performance laptop with M2 chip',
        sku: 'MBP-16-M2-512',
        barcode: '1234567890123',
        category: laptopsCategory._id,
        supplier: suppliers[0]._id,
        price: {
          cost: 1800,
          selling: 2499,
          currency: 'USD'
        },
        stock: {
          quantity: 25,
          minQuantity: 5,
          maxQuantity: 100,
          unit: 'piece',
          location: {
            warehouse: 'Main Warehouse',
            aisle: 'A1',
            shelf: 'S3',
            bin: 'B15'
          }
        },
        dimensions: {
          length: 35.57,
          width: 24.59,
          height: 1.68,
          weight: 2.15,
          unit: 'cm',
          weightUnit: 'kg'
        },
        tags: ['laptop', 'apple', 'professional'],
        createdBy: adminUser._id
      },
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with titanium design',
        sku: 'IPH-15-PRO-128',
        barcode: '2345678901234',
        category: smartphonesCategory._id,
        supplier: suppliers[1]._id,
        price: {
          cost: 800,
          selling: 999,
          currency: 'USD'
        },
        stock: {
          quantity: 50,
          minQuantity: 10,
          maxQuantity: 200,
          unit: 'piece',
          location: {
            warehouse: 'Main Warehouse',
            aisle: 'B2',
            shelf: 'S1',
            bin: 'B8'
          }
        },
        dimensions: {
          length: 14.67,
          width: 7.08,
          height: 0.83,
          weight: 0.187,
          unit: 'cm',
          weightUnit: 'kg'
        },
        tags: ['smartphone', 'apple', 'premium'],
        createdBy: adminUser._id
      },
      {
        name: 'Men\'s Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt',
        sku: 'TSH-MEN-COT-L-BLU',
        barcode: '3456789012345',
        category: mensClothingCategory._id,
        supplier: suppliers[2]._id,
        price: {
          cost: 8,
          selling: 19.99,
          currency: 'USD'
        },
        stock: {
          quantity: 150,
          minQuantity: 30,
          maxQuantity: 500,
          unit: 'piece',
          location: {
            warehouse: 'Clothing Warehouse',
            aisle: 'C1',
            shelf: 'S5',
            bin: 'B22'
          }
        },
        tags: ['clothing', 'mens', 'cotton', 'casual'],
        createdBy: adminUser._id
      },
      {
        name: 'JavaScript: The Definitive Guide',
        description: 'Comprehensive guide to JavaScript programming',
        sku: 'BOOK-JS-DEF-7ED',
        barcode: '4567890123456',
        category: booksCategory._id,
        supplier: suppliers[3]._id,
        price: {
          cost: 35,
          selling: 59.99,
          currency: 'USD'
        },
        stock: {
          quantity: 75,
          minQuantity: 15,
          maxQuantity: 200,
          unit: 'piece',
          location: {
            warehouse: 'Books Warehouse',
            aisle: 'D1',
            shelf: 'S2',
            bin: 'B5'
          }
        },
        tags: ['book', 'programming', 'javascript', 'technical'],
        createdBy: adminUser._id
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultrabook with premium build quality',
        sku: 'DELL-XPS13-I7-512',
        barcode: '5678901234567',
        category: laptopsCategory._id,
        supplier: suppliers[0]._id,
        price: {
          cost: 900,
          selling: 1299,
          currency: 'USD'
        },
        stock: {
          quantity: 3, // Low stock item
          minQuantity: 8,
          maxQuantity: 80,
          unit: 'piece',
          location: {
            warehouse: 'Main Warehouse',
            aisle: 'A1',
            shelf: 'S2',
            bin: 'B10'
          }
        },
        tags: ['laptop', 'dell', 'ultrabook'],
        createdBy: adminUser._id
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Android flagship smartphone',
        sku: 'SAM-S24-256-BLK',
        barcode: '6789012345678',
        category: smartphonesCategory._id,
        supplier: suppliers[1]._id,
        price: {
          cost: 650,
          selling: 899,
          currency: 'USD'
        },
        stock: {
          quantity: 0, // Out of stock item
          minQuantity: 12,
          maxQuantity: 150,
          unit: 'piece',
          location: {
            warehouse: 'Main Warehouse',
            aisle: 'B2',
            shelf: 'S2',
            bin: 'B12'
          }
        },
        status: 'out_of_stock',
        tags: ['smartphone', 'samsung', 'android'],
        createdBy: adminUser._id
      }
    ]);

    console.log('✅ Database seeding completed successfully!');
    console.log(`Created:`);
    console.log(`  - ${await User.countDocuments()} users`);
    console.log(`  - ${await Category.countDocuments()} categories`);
    console.log(`  - ${await Supplier.countDocuments()} suppliers`);
    console.log(`  - ${await Item.countDocuments()} items`);
    
    console.log('\n🔑 Admin credentials:');
    console.log('  Email: admin@inventory.com');
    console.log('  Password: admin123');
    
    console.log('\n👤 User credentials:');
    console.log('  Email: john@example.com');
    console.log('  Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await disconnectDB();
    process.exit();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData; 