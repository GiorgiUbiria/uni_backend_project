const Joi = require('joi');

const userSchemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required(),
    role: Joi.string().valid('user', 'admin').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    username: Joi.string().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    firstName: Joi.string().max(50).optional(),
    lastName: Joi.string().max(50).optional(),
    password: Joi.string().min(6).optional()
  })
};

const categorySchemas = {
  create: Joi.object({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(500).optional(),
    parentCategory: Joi.string().hex().length(24).optional()
  }),

  update: Joi.object({
    name: Joi.string().max(50).optional(),
    description: Joi.string().max(500).optional(),
    parentCategory: Joi.string().hex().length(24).optional().allow(null),
    isActive: Joi.boolean().optional()
  })
};

const supplierSchemas = {
  create: Joi.object({
    name: Joi.string().max(100).required(),
    contactPerson: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
    address: Joi.object({
      street: Joi.string().max(200).required(),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      postalCode: Joi.string().max(20).required(),
      country: Joi.string().max(100).required()
    }).required(),
    website: Joi.string().pattern(/^https?:\/\/.+/).optional(),
    paymentTerms: Joi.string().valid('Net 30', 'Net 60', 'Net 90', 'Cash on Delivery', 'Prepaid').optional(),
    taxId: Joi.string().max(50).optional(),
    rating: Joi.number().min(1).max(5).optional(),
    notes: Joi.string().max(1000).optional()
  }),

  update: Joi.object({
    name: Joi.string().max(100).optional(),
    contactPerson: Joi.string().max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    address: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(100).optional(),
      postalCode: Joi.string().max(20).optional(),
      country: Joi.string().max(100).optional()
    }).optional(),
    website: Joi.string().pattern(/^https?:\/\/.+/).optional(),
    paymentTerms: Joi.string().valid('Net 30', 'Net 60', 'Net 90', 'Cash on Delivery', 'Prepaid').optional(),
    taxId: Joi.string().max(50).optional(),
    isActive: Joi.boolean().optional(),
    rating: Joi.number().min(1).max(5).optional(),
    notes: Joi.string().max(1000).optional()
  })
};

const itemSchemas = {
  create: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(1000).optional(),
    sku: Joi.string().max(50).required(),
    barcode: Joi.string().max(100).optional(),
    category: Joi.string().hex().length(24).required(),
    supplier: Joi.string().hex().length(24).required(),
    price: Joi.object({
      cost: Joi.number().min(0).required(),
      selling: Joi.number().min(0).required(),
      currency: Joi.string().valid('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD').optional()
    }).required(),
    stock: Joi.object({
      quantity: Joi.number().min(0).optional(),
      minQuantity: Joi.number().min(0).required(),
      maxQuantity: Joi.number().min(0).optional(),
      unit: Joi.string().valid('piece', 'kg', 'gram', 'liter', 'meter', 'box', 'pack').optional(),
      location: Joi.object({
        warehouse: Joi.string().required(),
        aisle: Joi.string().optional(),
        shelf: Joi.string().optional(),
        bin: Joi.string().optional()
      }).required()
    }).required(),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional(),
      weight: Joi.number().min(0).optional(),
      unit: Joi.string().valid('cm', 'inch', 'meter').optional(),
      weightUnit: Joi.string().valid('kg', 'gram', 'pound', 'ounce').optional()
    }).optional(),
    status: Joi.string().valid('active', 'discontinued', 'out_of_stock', 'pending').optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().required(),
        alt: Joi.string().optional(),
        isPrimary: Joi.boolean().optional()
      })
    ).optional(),
    expiryDate: Joi.date().optional()
  }),

  update: Joi.object({
    name: Joi.string().max(100).optional(),
    description: Joi.string().max(1000).optional(),
    sku: Joi.string().max(50).optional(),
    barcode: Joi.string().max(100).optional(),
    category: Joi.string().hex().length(24).optional(),
    supplier: Joi.string().hex().length(24).optional(),
    price: Joi.object({
      cost: Joi.number().min(0).optional(),
      selling: Joi.number().min(0).optional(),
      currency: Joi.string().valid('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD').optional()
    }).optional(),
    stock: Joi.object({
      quantity: Joi.number().min(0).optional(),
      minQuantity: Joi.number().min(0).optional(),
      maxQuantity: Joi.number().min(0).optional(),
      unit: Joi.string().valid('piece', 'kg', 'gram', 'liter', 'meter', 'box', 'pack').optional(),
      location: Joi.object({
        warehouse: Joi.string().optional(),
        aisle: Joi.string().optional(),
        shelf: Joi.string().optional(),
        bin: Joi.string().optional()
      }).optional()
    }).optional(),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional(),
      weight: Joi.number().min(0).optional(),
      unit: Joi.string().valid('cm', 'inch', 'meter').optional(),
      weightUnit: Joi.string().valid('kg', 'gram', 'pound', 'ounce').optional()
    }).optional(),
    status: Joi.string().valid('active', 'discontinued', 'out_of_stock', 'pending').optional(),
    tags: Joi.array().items(Joi.string().max(30)).optional(),
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().required(),
        alt: Joi.string().optional(),
        isPrimary: Joi.boolean().optional()
      })
    ).optional(),
    expiryDate: Joi.date().optional()
  }),

  updateStock: Joi.object({
    quantity: Joi.number().min(0).required(),
    operation: Joi.string().valid('set', 'add', 'subtract').optional()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }

    req.validatedQuery = value;
    next();
  };
};

const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    search: Joi.string().optional()
  }),

  itemsQuery: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    search: Joi.string().optional(),
    category: Joi.string().hex().length(24).optional(),
    supplier: Joi.string().hex().length(24).optional(),
    status: Joi.string().valid('active', 'discontinued', 'out_of_stock', 'pending').optional(),
    minQuantity: Joi.number().min(0).optional(),
    maxQuantity: Joi.number().min(0).optional()
  })
};

module.exports = {
  validate,
  validateQuery,
  userSchemas,
  categorySchemas,
  supplierSchemas,
  itemSchemas,
  querySchemas
}; 