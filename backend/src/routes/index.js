const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const storeRoutes = require("./store.routes");

// Auth routes
router.use("/auth", authRoutes);

// Store routes
router.use("/stores", storeRoutes); // Add store routes

module.exports = router;
