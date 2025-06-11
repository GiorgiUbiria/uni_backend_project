const Product = require('../models/Product');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');

class ProductController {
  // Get all products with pagination and filtering
  getAllProducts = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      sort = 'title',
      title,
      category,
      minPrice,
      maxPrice,
      warehouseName
    } = req.query;

    // Execute search with pagination
    const products = await Product.searchProducts({}, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      title,
      category,
      minPrice,
      maxPrice,
      warehouseName
    });

    // Get total count for pagination
    const query = { isActive: true };
    if (title) query.title = { $regex: title, $options: 'i' };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (warehouseName) {
      query['warehouses.warehouseName'] = { $regex: warehouseName, $options: 'i' };
    }

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  });

  // Get single product by ID
  getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('category', 'name description')
      .populate('createdBy', 'username fullName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        product
      }
    });
  });

  // Add new product
  addProduct = asyncHandler(async (req, res) => {
    const productData = {
      ...req.validatedBody,
      createdBy: req.user._id
    };

    // Verify category exists and is active
    const category = await Category.findOne({ _id: productData.category, isActive: true });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found or inactive'
      });
    }

    const product = await Product.create(productData);

    await product.populate([
      { path: 'category', select: 'name description' },
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });
  });

  // Update product
  updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.validatedBody;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify category if being updated
    if (updateData.category) {
      const category = await Category.findOne({ _id: updateData.category, isActive: true });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found or inactive'
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'category', select: 'name description' },
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product: updatedProduct
      }
    });
  });

  // Update product specifications
  updateProductSpecifications = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { specifications } = req.validatedBody;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update specifications
    Object.keys(specifications).forEach(key => {
      product.specifications.set(key, specifications[key]);
    });

    await product.save();

    res.json({
      success: true,
      message: 'Product specifications updated successfully',
      data: {
        product
      }
    });
  });

  // Search products with title filtering and pagination
  searchProducts = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      title,
      category,
      minPrice,
      maxPrice,
      warehouseName,
      sort = 'title'
    } = req.query;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title search parameter is required'
      });
    }

    // Execute search
    const products = await Product.searchProducts({}, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      title,
      category,
      minPrice,
      maxPrice,
      warehouseName
    });

    // Get total count
    const query = { 
      isActive: true,
      title: { $regex: title, $options: 'i' }
    };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (warehouseName) {
      query['warehouses.warehouseName'] = { $regex: warehouseName, $options: 'i' };
    }

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        searchTerm: title,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  });

  // Update warehouse quantity
  updateWarehouseQuantity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { warehouseName, quantity } = req.validatedBody;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.updateWarehouseQuantity(warehouseName, quantity);

    res.json({
      success: true,
      message: 'Warehouse quantity updated successfully',
      data: {
        product
      }
    });
  });

  // Get products by warehouse
  getProductsByWarehouse = asyncHandler(async (req, res) => {
    const { warehouseName } = req.params;
    const { limit = 50 } = req.query;

    const products = await Product.getProductsByWarehouse(warehouseName)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        warehouse: warehouseName,
        products,
        count: products.length
      }
    });
  });

  // Get low stock products
  getLowStockProducts = asyncHandler(async (req, res) => {
    const { threshold = 10, limit = 50 } = req.query;

    const products = await Product.getLowStockProducts(parseInt(threshold))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        threshold: parseInt(threshold),
        products,
        count: products.length
      }
    });
  });

  // Delete product
  deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  });

  // Get product statistics
  getProductStats = asyncHandler(async (req, res) => {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: '$price' },
          averagePrice: { $avg: '$price' },
          totalQuantity: { $sum: { $sum: '$warehouses.quantity' } }
        }
      }
    ]);

    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 },
          totalValue: { $sum: '$price' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get warehouse distribution
    const warehouseDistribution = await Product.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$warehouses' },
      {
        $group: {
          _id: '$warehouses.warehouseName',
          productCount: { $sum: 1 },
          totalQuantity: { $sum: '$warehouses.quantity' }
        }
      },
      { $sort: { productCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalProducts: 0,
          totalValue: 0,
          averagePrice: 0,
          totalQuantity: 0
        },
        productsByCategory,
        warehouseDistribution
      }
    });
  });
}

module.exports = new ProductController(); 