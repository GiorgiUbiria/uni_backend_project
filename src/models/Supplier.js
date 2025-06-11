const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Supplier name cannot exceed 100 characters']
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State name cannot exceed 100 characters']
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters']
    }
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  },
  paymentTerms: {
    type: String,
    enum: ['Net 30', 'Net 60', 'Net 90', 'Cash on Delivery', 'Prepaid'],
    default: 'Net 30'
  },
  taxId: {
    type: String,
    trim: true,
    maxlength: [50, 'Tax ID cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 3
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  const { street, city, state, postalCode, country } = this.address;
  return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
});

// Virtual for items count supplied by this supplier
supplierSchema.virtual('itemsCount', {
  ref: 'Item',
  localField: '_id',
  foreignField: 'supplier',
  count: true
});

// Instance method to update rating
supplierSchema.methods.updateRating = async function(newRating) {
  if (newRating < 1 || newRating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  this.rating = newRating;
  return await this.save();
};

// Instance method to get contact info
supplierSchema.methods.getContactInfo = function() {
  return {
    name: this.name,
    contactPerson: this.contactPerson,
    email: this.email,
    phone: this.phone,
    address: this.fullAddress
  };
};

// Static method to find active suppliers
supplierSchema.statics.findActiveSuppliers = function() {
  return this.find({ isActive: true }).populate('createdBy', 'username fullName');
};

// Static method to find suppliers by rating
supplierSchema.statics.findByRating = function(minRating = 1, maxRating = 5) {
  return this.find({ 
    rating: { $gte: minRating, $lte: maxRating },
    isActive: true 
  });
};

// Static method to find suppliers by location
supplierSchema.statics.findByLocation = function(city, state, country) {
  const query = { isActive: true };
  
  if (city) query['address.city'] = new RegExp(city, 'i');
  if (state) query['address.state'] = new RegExp(state, 'i');
  if (country) query['address.country'] = new RegExp(country, 'i');
  
  return this.find(query);
};

// Index for efficient searching
supplierSchema.index({ name: 'text', 'address.city': 'text', 'address.country': 'text' });
supplierSchema.index({ isActive: 1, rating: -1 });

module.exports = mongoose.model('Supplier', supplierSchema); 