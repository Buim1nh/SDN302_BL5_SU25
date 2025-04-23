const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

router.put("/inventory/:productId", inventoryController.updateInventory);
router.get("/inventory/:productId", inventoryController.getInventoryByProduct);
router.get("/inventories", inventoryController.getAllInventories);

module.exports = router;
