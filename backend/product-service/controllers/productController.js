const Product = require('../models/Product');

// @desc    Create a new product
// @route   POST /products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
    try {
        // Ensure inStock is set based on stock value
        if (req.body.stock !== undefined) {
            req.body.inStock = req.body.stock > 0;
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all products
// @route   GET /products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const { category, platformType, limit = 10, page = 1, sort } = req.query;

        // Build query filter
        const filter = {};

        // Add category filter if provided
        if (category && category !== '') {
            filter.category = category;
        }

        // Add platform filter if provided
        if (platformType && platformType !== '') {
            filter.platformType = platformType;
        }

        console.log('Applied filters:', filter);

        // Set pagination options
        const options = {
            limit: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
            sort: sort ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } : { createdAt: -1 }
        };

        const products = await Product.find(filter)
            .limit(options.limit)
            .skip(options.skip)
            .sort(options.sort);

        // Process products to ensure inStock flag is correctly set
        const processedProducts = products.map(product => {
            const doc = product.toObject();
            // Explicitly set inStock based on stock value
            doc.inStock = doc.stock > 0;
            return doc;
        });

        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: processedProducts.length,
            products: processedProducts,
            result: {
                products: processedProducts,
                metadata: {
                    totalProducts,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalProducts / parseInt(limit)),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single product
// @route   GET /products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Convert to plain object and ensure inStock is correctly set
        const productData = product.toObject();
        productData.inStock = productData.stock > 0;

        res.status(200).json({
            success: true,
            product: productData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update product
// @route   PUT /products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // If stock is provided, ensure inStock is consistent with it
        if (req.body.stock !== undefined) {
            req.body.inStock = req.body.stock > 0;
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Convert to plain object to ensure inStock is correctly set
        const updatedProduct = product.toObject();
        updatedProduct.inStock = updatedProduct.stock > 0;

        res.status(200).json({
            success: true,
            product: updatedProduct
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await product.remove();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get products by category
// @route   GET /products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.category });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 