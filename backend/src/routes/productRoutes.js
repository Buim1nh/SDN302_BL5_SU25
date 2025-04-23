const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// CRUD sản phẩm
router.post('/', productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.patch('/:id/hide', productController.hideProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
