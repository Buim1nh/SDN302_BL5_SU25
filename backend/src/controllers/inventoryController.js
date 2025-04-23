// controllers/inventoryController.js
const Inventory = require("../models/Inventory");

exports.updateInventory = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  try {
    const updated = await Inventory.findOneAndUpdate(
      { productId },
      { $set: { quantity, lastUpdated: new Date() } },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getInventoryByProduct = async (req, res) => {
    const { productId } = req.params;
  
    try {
      const inventory = await Inventory.findOne({ productId });
      if (!inventory) {
        return res.status(404).json({ message: "No inventory found." });
      }
      res.json(inventory);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  exports.getAllInventories = async (req, res) => {
    try {
      const inventories = await Inventory.find().populate("productId");
      res.json(inventories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
    