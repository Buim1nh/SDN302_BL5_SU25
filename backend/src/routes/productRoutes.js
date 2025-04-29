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
router.get('/seller/:sellerId/on-sale', productController.getProductsBySellerId); // Đang bán
router.get('/seller/:sellerId/total-on-sale', productController.getTotalQuantityOnSale);//Tổng số luong đang bán
router.get('/buyer/:buyerId/purchased-products', productController.getPurchasedOrdersByBuyerId);//Lịch sử mua
router.get('/buyer/:buyerId/total-purchased-products', productController.getTotalPurchasedProducts);//Tổng đơn hàng đã mua
router.get('/seller/:sellerId/sold-products', productController.getSoldProductsBySellerId);//Đã bán
router.patch("update-auction-status/:idProduct", productController.toggleAuctionStatus);
router.post("/add-product", productController.addProduct);
module.exports = router;
