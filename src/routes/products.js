const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateQuery, productSchemas, querySchemas } = require('../middleware/validation');

const productController = require('../controllers/productController');

router.use(authenticate);

router.get('/', 
  validateQuery(querySchemas.productsQuery),
  productController.getAllProducts
);

router.get('/search',
  validateQuery(querySchemas.productsQuery),
  productController.searchProducts
);

router.get('/stats',
  authorize('admin'),
  productController.getProductStats
);

router.get('/low-stock',
  productController.getLowStockProducts
);

router.get('/:id',
  productController.getProductById
);

router.use(authorize('admin'));

router.post('/',
  validate(productSchemas.create),
  productController.addProduct
);

router.put('/:id',
  validate(productSchemas.update),
  productController.updateProduct
);

router.patch('/:id/specifications',
  validate(productSchemas.updateSpecifications),
  productController.updateProductSpecifications
);

router.patch('/:id/warehouse',
  validate(productSchemas.updateWarehouse),
  productController.updateWarehouseQuantity
);

router.delete('/:id',
  productController.deleteProduct
);

module.exports = router; 