const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get current user (protected route)
router.get('/me', authMiddleware, authController.getCurrentUser);

// Logout user
router.post('/logout', authMiddleware, authController.logout);

// Upgrade user to seller role (protected route)
router.post('/upgrade-to-seller', authMiddleware, authController.upgradeToSeller);

// Create a store for a seller (protected route)
router.post('/create-store', authMiddleware, authController.createStore);

// Get store details for a seller (protected route)
router.get('/store', authMiddleware, authController.getStore);

module.exports = router;