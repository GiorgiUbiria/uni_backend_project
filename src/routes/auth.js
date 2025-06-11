const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, userSchemas, querySchemas, validateQuery } = require('../middleware/validation');

router.post('/register', validate(userSchemas.register), authController.register);
router.post('/login', validate(userSchemas.login), authController.login);

router.use(authenticateToken);

router.get('/profile', authController.getProfile);
router.put('/profile', validate(userSchemas.updateProfile), authController.updateProfile);

router.get('/users', requireAdmin, validateQuery(querySchemas.pagination), authController.getAllUsers);
router.delete('/users/:id', requireAdmin, authController.deleteUser);
router.patch('/users/:id/toggle-status', requireAdmin, authController.toggleUserStatus);

module.exports = router; 