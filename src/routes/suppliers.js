const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, supplierSchemas, querySchemas, validateQuery } = require('../middleware/validation');

router.use(authenticateToken);

router.get('/', validateQuery(querySchemas.pagination), supplierController.getAllSuppliers);
router.get('/stats', supplierController.getSupplierStats);
router.get('/top', supplierController.getTopSuppliers);
router.get('/by-rating', supplierController.getSuppliersByRating);
router.get('/by-location', supplierController.getSuppliersByLocation);
router.get('/:id', supplierController.getSupplierById);

router.post('/', requireAdmin, validate(supplierSchemas.create), supplierController.createSupplier);
router.put('/:id', requireAdmin, validate(supplierSchemas.update), supplierController.updateSupplier);
router.delete('/:id', requireAdmin, supplierController.deleteSupplier);
router.patch('/:id/rating', requireAdmin, supplierController.updateSupplierRating);
router.patch('/:id/toggle-status', requireAdmin, supplierController.toggleSupplierStatus);

module.exports = router; 