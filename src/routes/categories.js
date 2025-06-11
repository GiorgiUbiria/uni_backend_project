const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, categorySchemas, querySchemas, validateQuery } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/', validateQuery(querySchemas.pagination), categoryController.getAllCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/root', categoryController.getRootCategories);
router.get('/top', categoryController.getTopCategories);
router.get('/:id', categoryController.getCategoryById);

router.post('/', requireAdmin, validate(categorySchemas.create), categoryController.createCategory);
router.put('/:id', requireAdmin, validate(categorySchemas.update), categoryController.updateCategory);
router.delete('/:id', requireAdmin, categoryController.deleteCategory);

module.exports = router; 