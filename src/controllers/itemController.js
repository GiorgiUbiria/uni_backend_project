const Item = require('../models/Item');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const { asyncHandler } = require('../middleware/errorHandler');

class ItemController {
  getAllItems = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      supplier,
      status,
      minQuantity,
      maxQuantity,
      minPrice,
      maxPrice,
      sortBy = 'name',
      sortOrder = 'asc',
      includeExpired = false
    } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;

    if (supplier) query.supplier = supplier;

    if (status) query.status = status;

    if (minQuantity || maxQuantity) {
      query['stock.quantity'] = {};
      if (minQuantity) query['stock.quantity'].$gte = parseInt(minQuantity);
      if (maxQuantity) query['stock.quantity'].$lte = parseInt(maxQuantity);
    }

    if (minPrice || maxPrice) {
      query['price.selling'] = {};
      if (minPrice) query['price.selling'].$gte = parseFloat(minPrice);
      if (maxPrice) query['price.selling'].$lte = parseFloat(maxPrice);
    }

    if (!includeExpired) {
      query.$or = [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: new Date() } }
      ];
    }

    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const items = await Item.find(query)
      .populate('category', 'name description')
      .populate('supplier', 'name contactPerson email')
      .populate('createdBy', 'username fullName')
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  });

  getItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await Item.findById(id)
      .populate('category', 'name description')
      .populate('supplier', 'name contactPerson email phone address')
      .populate('createdBy', 'username fullName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: {
        item
      }
    });
  });

  createItem = asyncHandler(async (req, res) => {
    const itemData = {
      ...req.validatedBody,
      createdBy: req.user._id
    };

    const category = await Category.findOne({ _id: itemData.category, isActive: true });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found or inactive'
      });
    }

    const supplier = await Supplier.findOne({ _id: itemData.supplier, isActive: true });
    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier not found or inactive'
      });
    }

    const item = await Item.create(itemData);

    await item.populate([
      { path: 'category', select: 'name description' },
      { path: 'supplier', select: 'name contactPerson email' },
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: {
        item
      }
    });
  });

  updateItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.validatedBody;

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    if (updateData.sku && updateData.sku !== item.sku) {
      const existingItem = await Item.findOne({
        sku: updateData.sku,
        _id: { $ne: id }
      });

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists for another item'
        });
      }
    }

    if (updateData.category) {
      const category = await Category.findOne({ _id: updateData.category, isActive: true });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found or inactive'
        });
      }
    }

    if (updateData.supplier) {
      const supplier = await Supplier.findOne({ _id: updateData.supplier, isActive: true });
      if (!supplier) {
        return res.status(400).json({
          success: false,
          message: 'Supplier not found or inactive'
        });
      }
    }

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'category', select: 'name description' },
      { path: 'supplier', select: 'name contactPerson email' },
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: {
        item: updatedItem
      }
    });
  });

  deleteItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  });

  updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.validatedBody;

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    await item.updateStock(quantity, operation);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        item
      }
    });
  });

  getLowStockItems = asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;

    const lowStockItems = await Item.findLowStock()
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        items: lowStockItems,
        count: lowStockItems.length
      }
    });
  });

  getExpiringItems = asyncHandler(async (req, res) => {
    const { days = 30, limit = 50 } = req.query;

    const expiringItems = await Item.findExpiringItems(parseInt(days))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        items: expiringItems,
        count: expiringItems.length
      }
    });
  });

  getInventorySummary = asyncHandler(async (req, res) => {
    const summary = await Item.getInventorySummary();

    res.json({
      success: true,
      data: summary[0] || {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      }
    });
  });

  searchItems = asyncHandler(async (req, res) => {
    const { query, limit = 20 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const items = await Item.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        items,
        count: items.length
      }
    });
  });

  getReorderItems = asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;

    const reorderItems = await Item.find({
      status: 'active',
      $expr: { $lte: ['$stock.quantity', '$stock.minQuantity'] }
    })
      .populate('category', 'name')
      .populate('supplier', 'name contactPerson email phone')
      .sort({ 'stock.quantity': 1 })
      .limit(parseInt(limit));

    const itemsWithReorderSuggestions = reorderItems.map(item => ({
      ...item.toJSON(),
      reorderQuantity: item.calculateReorderQuantity(),
      needsReordering: item.needsReordering()
    }));

    res.json({
      success: true,
      data: {
        items: itemsWithReorderSuggestions,
        count: itemsWithReorderSuggestions.length
      }
    });
  });

  bulkUpdateItems = asyncHandler(async (req, res) => {
    const { itemIds, updateData } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Item IDs array is required'
      });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Update data is required'
      });
    }

    const result = await Item.updateMany(
      { _id: { $in: itemIds } },
      updateData,
      { runValidators: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} items updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  });

  getItemAnalytics = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const newItems = await Item.countDocuments({
      createdAt: { $gte: daysAgo }
    });

    const stockMovements = await Item.countDocuments({
      lastRestocked: { $gte: daysAgo }
    });

    const topCategoriesByValue = await Item.aggregate([
      { $match: { status: 'active' } },
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
          totalValue: { $sum: { $multiply: ['$stock.quantity', '$price.selling'] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 5 }
    ]);

    const profitAnalysis = await Item.aggregate([
      { $match: { status: 'active' } },
      {
        $addFields: {
          profitMargin: {
            $cond: [
              { $eq: ['$price.cost', 0] },
              0,
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$price.selling', '$price.cost'] }, '$price.cost'] },
                  100
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageMargin: { $avg: '$profitMargin' },
          highMarginItems: {
            $sum: { $cond: [{ $gte: ['$profitMargin', 20] }, 1, 0] }
          },
          lowMarginItems: {
            $sum: { $cond: [{ $lt: ['$profitMargin', 10] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        newItems,
        stockMovements,
        topCategoriesByValue,
        profitAnalysis: profitAnalysis[0] || {
          averageMargin: 0,
          highMarginItems: 0,
          lowMarginItems: 0
        }
      }
    });
  });
}

module.exports = new ItemController(); 