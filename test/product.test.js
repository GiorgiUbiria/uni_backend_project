const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/server');
const { expect } = chai;

chai.use(chaiHttp);

describe('Product Tests', function() {
  this.timeout(10000);

  let authToken;
  let adminToken;
  let testProduct;
  let categoryId;

  before(async function() {
    // Login as regular user
    const userLogin = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      });
    authToken = userLogin.body.data.token;

    // Login as admin
    const adminLogin = await chai.request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@inventory.com',
        password: 'admin123'
      });
    adminToken = adminLogin.body.data.token;

    // Get a category ID for testing
    const categories = await chai.request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);
    categoryId = categories.body.data.categories[0]._id;
  });

  describe('GET /api/products', function() {
    it('should get all products with pagination', async function() {
      const res = await chai.request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('products');
      expect(res.body.data).to.have.property('pagination');
      expect(res.body.data.products).to.be.an('array');
    });

    it('should filter products by title', async function() {
      const res = await chai.request(app)
        .get('/api/products?title=MacBook')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.products).to.be.an('array');
      if (res.body.data.products.length > 0) {
        expect(res.body.data.products[0].title).to.match(/MacBook/i);
      }
    });
  });

  describe('GET /api/products/search', function() {
    it('should search products by title', async function() {
      const res = await chai.request(app)
        .get('/api/products/search?title=iPhone')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('searchTerm', 'iPhone');
      expect(res.body.data.products).to.be.an('array');
    });

    it('should require title parameter for search', async function() {
      const res = await chai.request(app)
        .get('/api/products/search')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message').that.includes('Title search parameter is required');
    });
  });

  describe('POST /api/products', function() {
    it('should create a new product with admin token', async function() {
      const productData = {
        title: 'Test Product',
        category: categoryId,
        price: 199.99,
        warehouses: [
          {
            warehouseName: 'Test Warehouse',
            location: 'Test Location',
            quantity: 50
          }
        ],
        specifications: {
          'Color': 'Blue',
          'Weight': '1kg'
        }
      };

      const res = await chai.request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.product).to.have.property('title', 'Test Product');
      expect(res.body.data.product).to.have.property('price', 199.99);
      testProduct = res.body.data.product;
    });

    it('should not allow regular user to create product', async function() {
      const productData = {
        title: 'Unauthorized Product',
        category: categoryId,
        price: 99.99,
        warehouses: [
          {
            warehouseName: 'Test Warehouse',
            quantity: 10
          }
        ]
      };

      const res = await chai.request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('GET /api/products/:id', function() {
    it('should get a product by ID', async function() {
      if (!testProduct) this.skip();

      const res = await chai.request(app)
        .get(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.product).to.have.property('_id', testProduct._id);
      expect(res.body.data.product).to.have.property('title', testProduct.title);
    });

    it('should return 404 for non-existent product', async function() {
      const res = await chai.request(app)
        .get('/api/products/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('PATCH /api/products/:id/specifications', function() {
    it('should update product specifications with admin token', async function() {
      if (!testProduct) this.skip();

      const specifications = {
        'Color': 'Red',
        'Material': 'Plastic',
        'Warranty': '2 years'
      };

      const res = await chai.request(app)
        .patch(`/api/products/${testProduct._id}/specifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ specifications });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.product.specifications).to.have.property('Color', 'Red');
      expect(res.body.data.product.specifications).to.have.property('Material', 'Plastic');
    });

    it('should not allow regular user to update specifications', async function() {
      if (!testProduct) this.skip();

      const specifications = {
        'Color': 'Green'
      };

      const res = await chai.request(app)
        .patch(`/api/products/${testProduct._id}/specifications`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ specifications });

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('GET /api/products/warehouse/:warehouseName', function() {
    it('should get products by warehouse name', async function() {
      const res = await chai.request(app)
        .get('/api/products/warehouse/Main Warehouse')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('warehouse', 'Main Warehouse');
      expect(res.body.data.products).to.be.an('array');
    });
  });

  describe('GET /api/products/low-stock', function() {
    it('should get low stock products', async function() {
      const res = await chai.request(app)
        .get('/api/products/low-stock?threshold=50')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('threshold', 50);
      expect(res.body.data.products).to.be.an('array');
    });
  });
}); 