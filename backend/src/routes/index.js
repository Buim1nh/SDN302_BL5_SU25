const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const storeRoutes = require("./store.routes");
const adminRoutes = require("./admin.routes");

// Auth routes
router.use("/auth", authRoutes);

// Store routes
router.use("/stores", storeRoutes); // Add store routes

// Admin routes
router.use("/admin", adminRoutes);

module.exports = router;
