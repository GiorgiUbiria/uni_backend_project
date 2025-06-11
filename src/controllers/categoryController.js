const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');

class CategoryController {
  getAllCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, includeInactive = false } = req.query;

    let query = {};
    if (!includeInactive) {
      query.isActive = true;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(query)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'username fullName')
      .populate('subcategories')
      .sort('name')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  });

  getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate('parentCategory', 'name')
      .populate('createdBy', 'username fullName')
      .populate('subcategories')
      .populate('itemsCount');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const hierarchy = await category.getHierarchy();

    res.json({
      success: true,
      data: {
        category: {
          ...category.toJSON(),
          hierarchy
        }
      }
    });
  });

  createCategory = asyncHandler(async (req, res) => {
    const { name, description, parentCategory } = req.validatedBody;

    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent || !parent.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found or inactive'
        });
      }
    }

    const category = await Category.create({
      name,
      description,
      parentCategory,
      createdBy: req.user._id
    });

    await category.populate([
      { path: 'parentCategory', select: 'name' },
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  });

  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, parentCategory, isActive } = req.validatedBody;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (parentCategory) {
      if (parentCategory === id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }

      const checkHierarchy = async (categoryId, targetParentId) => {
        const cat = await Category.findById(categoryId);
        if (!cat || !cat.parentCategory) return false;
        if (cat.parentCategory.toString() === targetParentId) return true;
        return await checkHierarchy(cat.parentCategory, targetParentId);
      };

      const isDescendant = await checkHierarchy(parentCategory, id);
      if (isDescendant) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set a descendant category as parent'
        });
      }

      const parent = await Category.findById(parentCategory);
      if (!parent || !parent.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found or inactive'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parentCategory !== undefined) updateData.parentCategory = parentCategory;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'parentCategory', select: 'name' },
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: updatedCategory
      }
    });
  });

  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const Item = require('../models/Item');
    const itemsCount = await Item.countDocuments({ category: id });

    if (itemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${itemsCount} items. Please move or delete items first.`
      });
    }

    await Category.updateMany(
      { parentCategory: id },
      { parentCategory: category.parentCategory }
    );

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  });

  getCategoryTree = asyncHandler(async (req, res) => {
    const buildTree = async (parentId = null) => {
      const categories = await Category.find({
        parentCategory: parentId,
        isActive: true
      }).populate('itemsCount');

      const tree = [];
      for (const category of categories) {
        const subcategories = await buildTree(category._id);
        tree.push({
          ...category.toJSON(),
          subcategories
        });
      }
      return tree;
    };

    const categoryTree = await buildTree();

    res.json({
      success: true,
      data: {
        categoryTree
      }
    });
  });

  getRootCategories = asyncHandler(async (req, res) => {
    const rootCategories = await Category.findRootCategories()
      .populate('itemsCount');

    res.json({
      success: true,
      data: {
        categories: rootCategories
      }
    });
  });

  getTopCategories = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const topCategories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: 'category',
          as: 'items'
        }
      },
      {
        $addFields: {
          itemsCount: { $size: '$items' }
        }
      },
      { $sort: { itemsCount: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy'
        }
      },
      {
        $unwind: '$createdBy'
      },
      {
        $project: {
          items: 0,
          'createdBy.password': 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        categories: topCategories
      }
    });
  });
}

module.exports = new CategoryController(); 