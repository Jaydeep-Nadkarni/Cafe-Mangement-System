const jwt = require('jsonwebtoken');
const { verifyToken, verifyRefreshToken, generateToken } = require('../utils/jwt');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  try {
    if (token) {
      // Verify token
      const decoded = verifyToken(token);

      // Get user from the token
      req.user = await Admin.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      return next();
    }
    throw new Error('No token provided');
  } catch (error) {
    // If access token is expired or missing, try to refresh using cookie
    if (req.cookies && req.cookies.refreshToken) {
      try {
        const decoded = verifyRefreshToken(req.cookies.refreshToken);
        const user = await Admin.findById(decoded.id).select('-password');

        if (user && user.isActive) {
          // Generate new access token
          const newAccessToken = generateToken(user._id, user.role);

          // Set header so client can update its local token
          res.setHeader('x-access-token', newAccessToken);

          req.user = user;
          return next();
        }
      } catch (refreshError) {
        // Refresh token also invalid/expired
        // Fall through to 401
      }
    }

    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const requireBranch = (req, res, next) => {
  if (req.user && (req.user.role === 'manager' || req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized for branch access' });
  }
};

module.exports = { protect, requireAdmin, requireBranch };
