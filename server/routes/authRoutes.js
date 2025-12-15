const express = require('express');
const router = express.Router();
const { loginAdmin, loginBranch, registerUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/admin/login', loginAdmin);
router.post('/branch/login', loginBranch);
router.post('/register', registerUser); // Keep public for setup, or protect later

// Example protected route to verify token
router.get('/me', protect, (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role
  });
});

module.exports = router;
