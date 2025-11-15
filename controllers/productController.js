const Product = require('../models/Product');

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Seller)
const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, tags } = req.body;

    // Validation
    if (!title || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, description, price and category'
      });
    }

    // Create product
    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      seller: req.userId,
      status: 'draft'
    });

    // Populate seller info
    await product.populate('seller', 'username email profile');

    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      data: { product }
    });

  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product. Please try again.'
    });
  }
};

// @desc    Get all products (with filtering)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'published',
      search
    } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    // Search in title, description, tags
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const products = await Product.find(filter)
      .populate('seller', 'username profile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username email profile');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('Get Product Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller - owner only)
const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this product'
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('seller', 'username email profile');

    res.json({
      success: true,
      message: 'Product updated successfully!',
      data: { product }
    });

  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller - owner only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully!'
    });

  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
};

// @desc    Get seller's products
// @route   GET /api/products/seller/my-products
// @access  Private (Seller)
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.userId })
      .populate('seller', 'username email profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { products }
    });

  } catch (error) {
    console.error('Get My Products Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your products'
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
};