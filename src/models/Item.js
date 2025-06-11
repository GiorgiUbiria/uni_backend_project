const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [50, 'SKU cannot exceed 50 characters']
  },
  barcode: {
    type: String,
    trim: true,
    maxlength: [100, 'Barcode cannot exceed 100 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  price: {
    cost: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative']
    },
    selling: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    }
  },
  stock: {
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    minQuantity: {
      type: Number,
      required: [true, 'Minimum quantity is required'],
      min: [0, 'Minimum quantity cannot be negative'],
      default: 10
    },
    maxQuantity: {
      type: Number,
      min: [0, 'Maximum quantity cannot be negative'],
      default: 1000
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['piece', 'kg', 'gram', 'liter', 'meter', 'box', 'pack'],
      default: 'piece'
    },
    location: {
      warehouse: {
        type: String,
        required: [true, 'Warehouse is required'],
        trim: true
      },
      aisle: {
        type: String,
        trim: true
      },
      shelf: {
        type: String,
        trim: true
      },
      bin: {
        type: String,
        trim: true
      }
    }
  },
  dimensions: {
    length: {
      type: Number,
      min: [0, 'Length cannot be negative']
    },
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative']
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative']
    },
    unit: {
      type: String,
      enum: ['cm', 'inch', 'meter'],
      default: 'cm'
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'gram', 'pound', 'ounce'],
      default: 'kg'
    }
  },
  status: {
    type: String,
    enum: ['active', 'discontinued', 'out_of_stock', 'pending'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  images: [{
    url: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  lastRestocked: {
    type: Date
  },
  expiryDate: {
    type: Date
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

// Virtual for profit margin
itemSchema.virtual('profitMargin').get(function() {
  if (this.price.cost === 0) return 0;
  return ((this.price.selling - this.price.cost) / this.price.cost * 100).toFixed(2);
});

// Virtual for stock status
itemSchema.virtual('stockStatus').get(function() {
  if (this.stock.quantity === 0) return 'out_of_stock';
  if (this.stock.quantity <= this.stock.minQuantity) return 'low_stock';
  if (this.stock.quantity >= this.stock.maxQuantity) return 'overstock';
  return 'in_stock';
});

// Virtual for full location
itemSchema.virtual('fullLocation').get(function() {
  const { warehouse, aisle, shelf, bin } = this.stock.location;
  let location = warehouse;
  if (aisle) location += ` - Aisle ${aisle}`;
  if (shelf) location += ` - Shelf ${shelf}`;
  if (bin) location += ` - Bin ${bin}`;
  return location;
});

// Virtual for total value
itemSchema.virtual('totalValue').get(function() {
  return (this.stock.quantity * this.price.cost).toFixed(2);
});

// Instance method to update stock
itemSchema.methods.updateStock = async function(quantity, operation = 'set') {
  switch (operation) {
    case 'add':
      this.stock.quantity += quantity;
      break;
    case 'subtract':
      this.stock.quantity = Math.max(0, this.stock.quantity - quantity);
      break;
    case 'set':
    default:
      this.stock.quantity = Math.max(0, quantity);
      break;
  }
  
  if (operation === 'add' && quantity > 0) {
    this.lastRestocked = new Date();
  }
  
  return await this.save();
};

// Instance method to check if item needs reordering
itemSchema.methods.needsReordering = function() {
  return this.stock.quantity <= this.stock.minQuantity;
};

// Instance method to calculate reorder quantity
itemSchema.methods.calculateReorderQuantity = function() {
  return Math.max(0, this.stock.maxQuantity - this.stock.quantity);
};

// Static method to find low stock items
itemSchema.statics.findLowStock = function() {
  return this.aggregate([
    {
      $match: {
        status: 'active',
        $expr: { $lte: ['$stock.quantity', '$stock.minQuantity'] }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $lookup: {
        from: 'suppliers',
        localField: 'supplier',
        foreignField: '_id',
        as: 'supplier'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $unwind: '$supplier'
    }
  ]);
};

// Static method to find expiring items
itemSchema.statics.findExpiringItems = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    status: 'active'
  }).populate('category supplier');
};

// Static method to get inventory summary
itemSchema.statics.getInventorySummary = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$stock.quantity', '$price.cost'] } },
        lowStockItems: {
          $sum: {
            $cond: [{ $lte: ['$stock.quantity', '$stock.minQuantity'] }, 1, 0]
          }
        },
        outOfStockItems: {
          $sum: {
            $cond: [{ $eq: ['$stock.quantity', 0] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to validate stock constraints
itemSchema.pre('save', function(next) {
  if (this.stock.maxQuantity && this.stock.minQuantity > this.stock.maxQuantity) {
    const error = new Error('Minimum quantity cannot be greater than maximum quantity');
    error.statusCode = 400;
    return next(error);
  }
  
  if (this.price.selling < this.price.cost) {
    console.warn(`Warning: Selling price for ${this.name} is below cost price`);
  }
  
  next();
});

// Indexes for efficient searching and querying
itemSchema.index({ name: 'text', description: 'text', sku: 'text' });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ supplier: 1, status: 1 });
itemSchema.index({ 'stock.quantity': 1, 'stock.minQuantity': 1 });
itemSchema.index({ status: 1, expiryDate: 1 });
itemSchema.index({ sku: 1 }, { unique: true });

module.exports = mongoose.model('Item', itemSchema); 