const Product = require("../models/Product");

// Lấy danh sách sản phẩm có phân trang
exports.getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const products = await Product.find().skip(skip).limit(limit);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Lỗi server" });
    }
};

// Lấy thông tin sản phẩm theo ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Lỗi server" });
    }
};

// Thêm sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const { name, price, description, image, brand, colors, sizes } = req.body;
        const newProduct = new Product({ name, price, description, image, brand, colors, sizes });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi thêm sản phẩm" });
    }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi cập nhật sản phẩm" });
    }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
        res.json({ message: "Sản phẩm đã bị xóa" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa sản phẩm" });
    }
};
