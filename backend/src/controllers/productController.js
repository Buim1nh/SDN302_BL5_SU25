const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
// Tạo sản phẩm
// Tạo sản phẩm
// Tạo sản phẩm
exports.createProduct = async (req, res) => {
  try {
    const { sellerId, title, description, price, categoryId, image } = req.body;

    // Validate required fields
    if (!sellerId) return res.status(400).json({ error: "Seller ID is required" });
    if (!image) return res.status(400).json({ error: "Image URL is required" });

    // Create the product
    const product = await Product.create({ title, description, price, image, categoryId, sellerId });

    if (!product) {
      return res.status(500).json({ error: "Unable to create product" });
    }

    // No quantity for the product, it will be handled in the Inventory
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy tất cả sản phẩm (có tồn kho)
exports.getAllProducts = async (req, res) => {
  try {
    const { sellerId } = req.query;

    const filter = {};
    if (sellerId) filter.sellerId = sellerId;

    const products = await Product.find(filter)
      .populate('categoryId')
      .populate('sellerId')
      .lean();

    const withInventory = await Promise.all(
      products.map(async (product) => {
        const inventory = await Inventory.findOne({ productId: product._id });
        return { ...product, quantity: inventory?.quantity || 0 };
      })
    );

    res.json(withInventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tạm ẩn sản phẩm
// Tạm ẩn (xoá mềm - chỉ xoá product)
exports.hideProduct = async (req, res) => {
    try {
      const deleted = await Product.findByIdAndDelete(req.params.id);
      res.json({ message: 'Product hidden (deleted from list)', deleted });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

// Xoá sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      await Inventory.deleteOne({ productId: req.params.id });
      res.json({ message: 'Product and inventory deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
// Lấy chi tiết 1 sản phẩm
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId')
      .populate('sellerId')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const inventory = await Inventory.findOne({ productId: product._id });

    res.json({
      ...product,
      quantity: inventory?.quantity || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Đang bán
exports.getProductsBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Tìm tất cả các sản phẩm của sellerId
    const products = await Product.find({ sellerId }).lean();

    // Nếu không có sản phẩm nào được tìm thấy, trả về mảng rỗng
    if (!products.length) {
      return res.json([]);
    }

    // Lấy tất cả thông tin tồn kho liên quan đến danh sách sản phẩm
    const productIds = products.map((product) => product._id);
    const inventories = await Inventory.find({ productId: { $in: productIds } }).lean();

    // Tạo một map để ánh xạ nhanh productId -> quantity
    const inventoryMap = inventories.reduce((map, inventory) => {
      map[inventory.productId.toString()] = inventory.quantity;
      return map;
    }, {});

    // Thêm thông tin tồn kho (quantity) vào từng sản phẩm
    const withInventory = products.map((product) => ({
      ...product,
      quantity: inventoryMap[product._id.toString()] || 0, // Nếu không có tồn kho, đặt quantity = 0
    }));

    // Trả về danh sách sản phẩm kèm tồn kho
    res.json(withInventory);
  } catch (err) {
    console.error("Error fetching products by sellerId:", err);
    res.status(500).json({ error: err.message });
  }
};

// Lịch sử mua hàng
exports.getPurchasedOrdersByBuyerId = async (req, res) => {
  try {
    const { buyerId } = req.params;

    // Tìm tất cả các đơn hàng của buyerId
    const orders = await Order.find({ buyerId }, '_id orderDate addressId status').lean();

    // Lấy danh sách orderIds từ các đơn hàng
    const orderIds = orders.map((order) => order._id);

    // Lấy danh sách OrderItems từ các đơn hàng
    const orderItems = await OrderItem.find({ orderId: { $in: orderIds } }, '_id orderId productId quantity unitPrice').lean();

    // Lấy thông tin chi tiết sản phẩm
    const productIds = orderItems.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }, '_id title image price').lean();

    // Xây dựng danh sách các đơn hàng với thông tin cần thiết
    const purchasedOrders = orders.map((order) => {
      // Lấy tất cả OrderItems thuộc về Order này
      const items = orderItems.filter((item) => item.orderId.toString() === order._id.toString());

      // Lấy thông tin chi tiết sản phẩm cho mỗi OrderItem
      const productsWithDetails = items.map((item) => {
        const product = products.find((p) => p._id.toString() === item.productId.toString());
        return {
          ...item,
          product,
        };
      });

      // Tính tổng quantity và tổng price cho đơn hàng
      const totalQuantity = productsWithDetails.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = productsWithDetails.reduce((sum, item) => sum + item.quantity * (item.unitPrice || item.product.price), 0);

      // Lấy hình ảnh đầu tiên (image) từ sản phẩm đầu tiên
      const firstImage = productsWithDetails.length > 0 ? productsWithDetails[0].product.images : null;

      return {
        orderId: order._id,
        orderDate: order.orderDate,
        addressId: order.addressId,
        status: order.status,
        totalQuantity,
        totalPrice,
        image: firstImage, // Hình ảnh đầu tiên của Order
        items: productsWithDetails, // Danh sách sản phẩm của Order (nếu cần chi tiết)
      };
    });

    res.json(purchasedOrders); // Trả về danh sách các đơn hàng
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Đã bán
exports.getSoldProductsBySellerId = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Tìm tất cả các sản phẩm của sellerId
    const products = await Product.find({ sellerId }).lean();

    // Lấy danh sách productIds từ những sản phẩm của seller
    const productIds = products.map((product) => product._id);

    // Lấy danh sách OrderItems liên quan đến các sản phẩm này, chỉ khi Order.status = "shipped"
    const soldItems = await OrderItem.find({ productId: { $in: productIds } })
      .populate({
        path: "orderId", // Populate để lấy thông tin Order
        select: "status", // Chỉ lấy trường status từ Order
        match: { status: "shipped" }, // Chỉ lấy các Order có trạng thái "shipped"
      })
      .lean();

    // Lọc ra các OrderItem có Order hợp lệ (tức là Order.status = "shipped")
    const filteredSoldItems = soldItems.filter((item) => item.orderId); // Loại bỏ các OrderItem không có Order khớp

    // Kết hợp thông tin sản phẩm với OrderItem, thêm unitPrice
    const soldProducts = filteredSoldItems.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId.toString());
      return {
        ...item,
        product, // Thông tin chi tiết sản phẩm
        unitPrice: item.unitPrice || product.price, // Lấy unitPrice từ OrderItem hoặc giá gốc từ Product
      };
    });

    // Tính tổng giá (total revenue)
    const totalRevenue = soldProducts.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    // Trả về danh sách sản phẩm đã bán và tổng doanh thu
    res.json({ soldProducts, totalRevenue });
  } catch (err) {
    console.error("Error in getSoldProductsBySellerId:", err);
    res.status(500).json({ error: err.message });
  }
};

//tổng số lượng sản phẩm đã mua
exports.getTotalPurchasedProducts = async (req, res) => {
  try {
    const { buyerId } = req.params;

    // Tìm tất cả các đơn hàng của buyerId
    const orders = await Order.find({ buyerId }, '_id').lean();
    const orderIds = orders.map((order) => order._id);

    // Lấy danh sách OrderItems từ các đơn hàng
    const orderItems = await OrderItem.find({ orderId: { $in: orderIds } }, 'quantity').lean();

    // Tính tổng số lượng sản phẩm
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ totalQuantity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//số sản phẩm
exports.getTotalQuantityOnSale = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Tìm tất cả các sản phẩm của sellerId
    const products = await Product.find({ sellerId }, '_id').lean();
    const productIds = products.map((product) => product._id);

    // Lấy danh sách tồn kho của các sản phẩm có quantity > 0
    const uniqueProducts = await Inventory.find({ productId: { $in: productIds }, quantity: { $gt: 0 } }, 'productId').distinct('productId').lean();

    // Số lượng sản phẩm khác nhau
    const totalDistinctProducts = uniqueProducts.length;

    res.json({ totalDistinctProducts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleAuctionStatus = async (req, res) => {
  try {
    const { idProduct } = req.params; // Lấy ID sản phẩm từ URL
    const { isAuction } = req.body; // Trạng thái đấu giá từ body request

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(idProduct);
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
    }

    // Cập nhật trạng thái đấu giá
    product.isAuction = isAuction;
    await product.save();

    // Trả về sản phẩm cập nhật
    res.status(200).json({
      message: `Trạng thái đấu giá đã được cập nhật thành công.`,
      product,
    });
  } catch (err) {
    console.error("Error updating auction status:", err);
    res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật trạng thái đấu giá." });
  }
};
exports.addProduct = async (req, res) => {
  try {
    const { title, description, price, image, isAuction,sellerId} = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!title || !description || price == null) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin sản phẩm." });
    }

    // Tạo sản phẩm mới
    const newProduct = new Product({
      title,
      description,
      price,
      image,
      isAuction: isAuction || false, 
      sellerId// Giá trị mặc định là false nếu không được cung cấp
    });

    // Lưu sản phẩm vào cơ sở dữ liệu
    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: "Sản phẩm đã được thêm thành công.",
      product: savedProduct,
    });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ message: "Đã xảy ra lỗi khi thêm sản phẩm." });
  }
};