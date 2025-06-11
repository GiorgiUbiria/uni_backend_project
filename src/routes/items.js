const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, itemSchemas, querySchemas, validateQuery } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/', validateQuery(querySchemas.itemsQuery), itemController.getAllItems);
router.get('/summary', itemController.getInventorySummary);
router.get('/low-stock', itemController.getLowStockItems);
router.get('/:id', itemController.getItemById);

router.post('/', requireAdmin, validate(itemSchemas.create), itemController.createItem);

module.exports = router; 