const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  warehouses: [{
    warehouseName: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    }
  }],
  specifications: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
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

productSchema.virtual('totalQuantity').get(function() {
  return this.warehouses.reduce((total, warehouse) => total + warehouse.quantity, 0);
});

productSchema.virtual('warehouseCount').get(function() {
  return this.warehouses.length;
});

productSchema.methods.updateWarehouseQuantity = async function(warehouseName, quantity) {
  const warehouse = this.warehouses.find(w => w.warehouseName === warehouseName);
  
  if (warehouse) {
    warehouse.quantity = Math.max(0, quantity);
  } else {
    this.warehouses.push({
      warehouseName,
      quantity: Math.max(0, quantity)
    });
  }
  
  return await this.save();
};

productSchema.methods.updateSpecification = async function(key, value) {
  this.specifications.set(key, value);
  return await this.save();
};

productSchema.methods.removeSpecification = async function(key) {
  this.specifications.delete(key);
  return await this.save();
};

productSchema.statics.searchProducts = function(query = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = 'title',
    title,
    category,
    minPrice,
    maxPrice,
    warehouseName
  } = options;

  const searchQuery = { isActive: true, ...query };

  if (title) {
    searchQuery.title = { $regex: title, $options: 'i' };
  }

  if (category) {
    searchQuery.category = category;
  }

  if (minPrice || maxPrice) {
    searchQuery.price = {};
    if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
    if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
  }

  if (warehouseName) {
    searchQuery['warehouses.warehouseName'] = { $regex: warehouseName, $options: 'i' };
  }

  return this.find(searchQuery)
    .populate('category', 'name description')
    .populate('createdBy', 'username fullName')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

productSchema.statics.getProductsByWarehouse = function(warehouseName) {
  return this.find({
    'warehouses.warehouseName': { $regex: warehouseName, $options: 'i' },
    isActive: true
  }).populate('category', 'name');
};

productSchema.statics.getLowStockProducts = function(threshold = 10) {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $addFields: {
        totalQuantity: { $sum: '$warehouses.quantity' }
      }
    },
    { $match: { totalQuantity: { $lte: threshold } } },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' }
  ]);
};

productSchema.index({ title: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'warehouses.warehouseName': 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema); 