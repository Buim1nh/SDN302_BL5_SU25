const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role, 
      avatarURL, 
      phone,
      fullName,
      street,
      city,
      state,
      country
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'buyer',
      avatarURL: avatarURL || ''
    });

    // Create address if address fields are provided
    if (fullName && phone && street && city && state && country) {
      const { Address } = require('../models');
      await Address.create({
        userId: user._id,
        fullName,
        phone,
        street,
        city,
        state,
        country,
        isDefault: true
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarURL: user.avatarURL
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarURL: user.avatarURL
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarURL: user.avatarURL
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user data',
      error: error.message
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = (req, res) => {
  // JWT is stateless, so we just return success
  // In a real app, you might want to invalidate the token on the client side
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Upgrade user to seller role
 * @route POST /api/auth/upgrade-to-seller
 * @access Private
 */
exports.upgradeToSeller = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is already a seller
    if (user.role === 'seller') {
      return res.status(400).json({
        success: false,
        message: 'User is already a seller'
      });
    }
    
    // Update user role to seller
    user.role = 'seller';
    await user.save();
    
    // Generate new JWT token with updated role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(200).json({
      success: true,
      message: 'User upgraded to seller successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarURL: user.avatarURL
      }
    });
  } catch (error) {
    logger.error('Upgrade to seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error upgrading user to seller',
      error: error.message
    });
  }
};

/**
 * Create a store for a seller
 * @route POST /api/auth/create-store
 * @access Private (Seller only)
 */
exports.createStore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeName, description, bannerImageURL } = req.body;
    
    // Validate required fields
    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: 'Store name is required'
      });
    }
    
    // Check if user is a seller
    const user = await User.findById(userId);
    if (!user || user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can create a store'
      });
    }
    
    // Check if store already exists for this seller
    const { Store } = require('../models');
    const existingStore = await Store.findOne({ sellerId: userId });
    
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'You already have a store'
      });
    }
    
    // Create the store
    const store = await Store.create({
      sellerId: userId,
      storeName,
      description: description || '',
      bannerImageURL: bannerImageURL || ''
    });
    
    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    logger.error('Create store error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating store',
      error: error.message
    });
  }
};

/**
 * Get store details for a seller
 * @route GET /api/auth/store
 * @access Private (Seller only)
 */
exports.getStore = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is a seller
    const user = await User.findById(userId);
    if (!user || user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can access store information'
      });
    }
    
    // Get the store
    const { Store } = require('../models');
    const store = await Store.findOne({ sellerId: userId });
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    res.status(200).json({
      success: true,
      store
    });
  } catch (error) {
    logger.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting store information',
      error: error.message
    });
  }
};