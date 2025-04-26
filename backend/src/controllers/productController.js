const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

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

