const express = require('express');
const {
  createPost,
  getPosts,
  toggleLike
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getPosts);

// Protected routes
router.use(protect);

router.post('/', createPost);
router.post('/:id/like', toggleLike);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Post routes are working!',
    endpoints: [
      'GET /api/posts',
      'POST /api/posts',
      'POST /api/posts/:id/like'
    ]
  });
});

module.exports = router;