const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Virtual for items count
categorySchema.virtual('itemsCount', {
  ref: 'Item',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Instance method to get category hierarchy
categorySchema.methods.getHierarchy = async function() {
  let category = this;
  const hierarchy = [category.name];
  
  while (category.parentCategory) {
    category = await this.constructor.findById(category.parentCategory);
    if (category) {
      hierarchy.unshift(category.name);
    } else {
      break;
    }
  }
  
  return hierarchy.join(' > ');
};

// Static method to find active categories
categorySchema.statics.findActiveCategories = function() {
  return this.find({ isActive: true }).populate('createdBy', 'username fullName');
};

// Static method to find root categories (no parent)
categorySchema.statics.findRootCategories = function() {
  return this.find({ parentCategory: null, isActive: true });
};

// Pre-remove middleware to handle cascading deletes
categorySchema.pre('remove', async function(next) {
  try {
    // Check if there are any items in this category
    const Item = mongoose.model('Item');
    const itemsCount = await Item.countDocuments({ category: this._id });
    
    if (itemsCount > 0) {
      const error = new Error('Cannot delete category that contains items');
      error.statusCode = 400;
      return next(error);
    }
    
    // Move subcategories to parent or make them root categories
    await this.constructor.updateMany(
      { parentCategory: this._id },
      { parentCategory: this.parentCategory }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Category', categorySchema); 