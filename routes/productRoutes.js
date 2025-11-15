const express = require('express');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleUploadErrors } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes (Seller only)
router.use(protect);
router.use(authorize('seller', 'admin'));

router.get('/seller/my-products', getMyProducts);
router.post('/', upload.array('files', 10), handleUploadErrors, createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Test route
router.get('/test/protected', (req, res) => {
  res.json({
    success: true,
    message: '✅ Product routes are working!',
    user: req.user
  });
});

module.exports = router;