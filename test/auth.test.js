const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/server');
const { createTestUser, createTestAdmin } = require('./setup');
const { generateToken } = require('../src/middleware/auth');

chai.use(chaiHttp);
const { expect } = chai;

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res).to.have.status(201);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('user');
      expect(res.body.data).to.have.property('token');
      expect(res.body.data.user.email).to.equal(userData.email);
      expect(res.body.data.user).to.not.have.property('password');
    });

    it('should not register a user with existing email', async () => {
      await createTestUser();

      const userData = {
        username: 'anotheruser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Another',
        lastName: 'User'
      };

      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res).to.have.status(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('already exists');
    });

    it('should validate required fields', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'invalid-email'
        });

      expect(res).to.have.status(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Validation failed');
      expect(res.body.errors).to.be.an('array');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser();
    });

    it('should login with valid credentials', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res).to.have.status(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('user');
      expect(res.body.data).to.have.property('token');
      expect(res.body.data.user.email).to.equal('test@example.com');
    });

    it('should not login with invalid credentials', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });

      expect(res).to.have.status(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Invalid credentials');
    });

    it('should not login inactive user', async () => {
      testUser.isActive = false;
      await testUser.save();

      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res).to.have.status(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let testUser, token;

    beforeEach(async () => {
      testUser = await createTestUser();
      token = generateToken(testUser._id);
    });

    it('should get user profile with valid token', async () => {
      const res = await chai
        .request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('user');
      expect(res.body.data.user.email).to.equal('test@example.com');
    });

    it('should not get profile without token', async () => {
      const res = await chai
        .request(app)
        .get('/api/auth/profile');

      expect(res).to.have.status(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Access token is required');
    });

    it('should not get profile with invalid token', async () => {
      const res = await chai
        .request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res).to.have.status(401);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.equal('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser, token;

    beforeEach(async () => {
      testUser = await createTestUser();
      token = generateToken(testUser._id);
    });

    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const res = await chai
        .request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.user.firstName).to.equal('Updated');
      expect(res.body.data.user.lastName).to.equal('Name');
    });

    it('should not update profile with existing username', async () => {
      await createTestUser({
        username: 'existinguser',
        email: 'existing@example.com'
      });

      const res = await chai
        .request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'existinguser' });

      expect(res).to.have.status(400);
      expect(res.body.success).to.be.false;
      expect(res.body.message).to.include('already taken');
    });
  });

  describe('Admin Routes', () => {
    let adminUser, adminToken, regularUser;

    beforeEach(async () => {
      adminUser = await createTestAdmin();
      adminToken = generateToken(adminUser._id);
      regularUser = await createTestUser();
    });

    describe('GET /api/auth/users', () => {
      it('should get all users as admin', async () => {
        const res = await chai
          .request(app)
          .get('/api/auth/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res).to.have.status(200);
        expect(res.body.success).to.be.true;
        expect(res.body.data.users).to.be.an('array');
        expect(res.body.data.users).to.have.length(2);
      });

      it('should not get users as regular user', async () => {
        const userToken = generateToken(regularUser._id);

        const res = await chai
          .request(app)
          .get('/api/auth/users')
          .set('Authorization', `Bearer ${userToken}`);

        expect(res).to.have.status(403);
        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal('Admin access required');
      });
    });

    describe('DELETE /api/auth/users/:id', () => {
      it('should delete user as admin', async () => {
        const res = await chai
          .request(app)
          .delete(`/api/auth/users/${regularUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res).to.have.status(200);
        expect(res.body.success).to.be.true;
        expect(res.body.message).to.include('deleted successfully');
      });

      it('should not delete own account', async () => {
        const res = await chai
          .request(app)
          .delete(`/api/auth/users/${adminUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res).to.have.status(400);
        expect(res.body.success).to.be.false;
        expect(res.body.message).to.include('Cannot delete your own account');
      });
    });
  });
}); 