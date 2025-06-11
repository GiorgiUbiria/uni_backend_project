const Supplier = require('../models/Supplier');
const { asyncHandler } = require('../middleware/errorHandler');

class SupplierController {
  getAllSuppliers = asyncHandler(async (req, res) => {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      includeInactive = false, 
      minRating,
      maxRating,
      city,
      state,
      country,
      sort = 'name'
    } = req.query;

    let query = {};
    
    if (!includeInactive) {
      query.isActive = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseFloat(minRating);
      if (maxRating) query.rating.$lte = parseFloat(maxRating);
    }

    if (city) query['address.city'] = { $regex: city, $options: 'i' };
    if (state) query['address.state'] = { $regex: state, $options: 'i' };
    if (country) query['address.country'] = { $regex: country, $options: 'i' };

    const suppliers = await Supplier.find(query)
      .populate('createdBy', 'username fullName')
      .populate('itemsCount')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Supplier.countDocuments(query);

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  });

  getSupplierById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const supplier = await Supplier.findById(id)
      .populate('createdBy', 'username fullName')
      .populate('itemsCount');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const contactInfo = supplier.getContactInfo();

    res.json({
      success: true,
      data: {
        supplier: {
          ...supplier.toJSON(),
          contactInfo
        }
      }
    });
  });

  createSupplier = asyncHandler(async (req, res) => {
    const supplierData = {
      ...req.validatedBody,
      createdBy: req.user._id
    };

    const supplier = await Supplier.create(supplierData);

    await supplier.populate([
      { path: 'createdBy', select: 'username fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: {
        supplier
      }
    });
  });

  updateSupplier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.validatedBody;

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    if (updateData.email && updateData.email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({
        email: updateData.email,
        _id: { $ne: id }
      });

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists for another supplier'
        });
      }
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'username fullName');

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: {
        supplier: updatedSupplier
      }
    });
  });

  deleteSupplier = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const Item = require('../models/Item');
    const itemsCount = await Item.countDocuments({ supplier: id });

    if (itemsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier with ${itemsCount} items. Please reassign or delete items first.`
      });
    }

    await supplier.deleteOne();

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  });

  updateSupplierRating = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    await supplier.updateRating(rating);

    res.json({
      success: true,
      message: 'Supplier rating updated successfully',
      data: {
        supplier
      }
    });
  });

  getSuppliersByRating = asyncHandler(async (req, res) => {
    const { minRating = 1, maxRating = 5, limit = 10 } = req.query;

    const suppliers = await Supplier.findByRating(
      parseFloat(minRating),
      parseFloat(maxRating)
    )
      .populate('createdBy', 'username fullName')
      .populate('itemsCount')
      .sort({ rating: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        suppliers
      }
    });
  });

  getSuppliersByLocation = asyncHandler(async (req, res) => {
    const { city, state, country, limit = 10 } = req.query;

    if (!city && !state && !country) {
      return res.status(400).json({
        success: false,
        message: 'At least one location parameter (city, state, country) is required'
      });
    }

    const suppliers = await Supplier.findByLocation(city, state, country)
      .populate('createdBy', 'username fullName')
      .populate('itemsCount')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        suppliers
      }
    });
  });

  getTopSuppliers = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const topSuppliers = await Supplier.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: 'supplier',
          as: 'items'
        }
      },
      {
        $addFields: {
          itemsCount: { $size: '$items' }
        }
      },
      { $sort: { rating: -1, itemsCount: -1 } },
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
        suppliers: topSuppliers
      }
    });
  });

  getSupplierStats = asyncHandler(async (req, res) => {
    const stats = await Supplier.aggregate([
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          activeSuppliers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          averageRating: { $avg: '$rating' },
          topRatedSuppliers: {
            $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
          }
        }
      }
    ]);

    const suppliersByCountry = await Supplier.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$address.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const paymentTermsDistribution = await Supplier.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$paymentTerms',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalSuppliers: 0,
          activeSuppliers: 0,
          averageRating: 0,
          topRatedSuppliers: 0
        },
        suppliersByCountry,
        paymentTermsDistribution
      }
    });
  });

  toggleSupplierStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    supplier.isActive = !supplier.isActive;
    await supplier.save();

    res.json({
      success: true,
      message: `Supplier ${supplier.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        supplier
      }
    });
  });
}

module.exports = new SupplierController(); 