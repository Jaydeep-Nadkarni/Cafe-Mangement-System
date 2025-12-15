const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwt');

// Helper function for authentication
const authenticateUser = async (req, res, allowedRoles) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await Admin.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Check role permissions
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login for Admin Portal
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  await authenticateUser(req, res, ['super_admin', 'admin']);
};

// @desc    Login for Branch Portal
// @route   POST /api/auth/branch/login
// @access  Public
const loginBranch = async (req, res) => {
  await authenticateUser(req, res, ['super_admin', 'admin', 'manager']);
};

// @desc    Register a new user (for initial setup or admin use)
// @route   POST /api/auth/register
// @access  Public (should be protected in production)
const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const userExists = await Admin.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await Admin.create({
      username,
      email,
      password,
      role: role || 'manager', // Default to manager
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginAdmin,
  loginBranch,
  registerUser
};
