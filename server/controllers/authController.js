const Admin = require('../models/Admin');
const Branch = require('../models/Branch');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// Helper function to set cookie
const setRefreshTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  res.cookie('refreshToken', token, cookieOptions);
};

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

      const accessToken = generateToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id, user.role);

      setRefreshTokenCookie(res, refreshToken);

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: accessToken,
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

// @desc    Login for Branch Portal using Branch Code
// @route   POST /api/auth/branch/login
// @access  Public
const loginBranch = async (req, res) => {
  const { branchCode, password } = req.body;

  try {
    // Find branch by code
    const branch = await Branch.findOne({ branchCode: branchCode.toUpperCase() })
      .populate('manager');

    if (!branch) {
      return res.status(401).json({ message: 'Invalid branch code or password' });
    }

    // Get the manager user
    const user = await Admin.findById(branch.manager._id).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Check if manager role
      if (!['manager', 'admin', 'super_admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. User is not a branch manager' });
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });

      const accessToken = generateToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id, user.role);

      setRefreshTokenCookie(res, refreshToken);

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        branchId: branch._id,
        branchName: branch.name,
        token: accessToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid branch code or password' });
    }
  } catch (error) {
    console.error('Branch Login Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
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
      const accessToken = generateToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id, user.role);

      setRefreshTokenCookie(res, refreshToken);

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: accessToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public (Cookie based)
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token found' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await Admin.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const newAccessToken = generateToken(user._id, user.role);
    
    // Optionally rotate refresh token here for extra security
    
    res.json({ token: newAccessToken });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Logout user / Clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  loginAdmin,
  loginBranch,
  registerUser,
  refreshToken,
  logoutUser
};
