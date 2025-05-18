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
        const { category, platformType, limit = 10, page = 1, sort, search } = req.query;

        console.log('Request query parameters:', req.query);

        // Build query filter
        const filter = {};

        // Add category filter if provided
        if (category && category !== '') {
            filter.category = category;
            console.log('Adding category filter:', category);
        }

        // Add platform filter if provided
        if (platformType && platformType !== '') {
            filter.platformType = platformType;
            console.log('Adding platformType filter:', platformType);
        }

        // Add search filter if provided
        if (search && search !== '') {
            filter.name = { $regex: search, $options: 'i' }; // Case insensitive search
            console.log('Adding search filter:', search);
        }

        console.log('Final filter object:', filter);

        // Set pagination options
        const options = {
            limit: parseInt(limit),
            skip: (parseInt(page) - 1) * parseInt(limit),
            sort: sort ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } : { createdAt: -1 }
        };

        console.log('Pagination options:', options);

        const products = await Product.find(filter)
            .limit(options.limit)
            .skip(options.skip)
            .sort(options.sort);

        // Process products to ensure inStock flag is correctly set and normalize data for frontend
        const processedProducts = products.map(product => {
            const doc = product.toObject();

            // Explicitly set inStock based on stock value
            doc.inStock = doc.stock > 0;

            // Add image field for frontend compatibility
            doc.image = doc.imageUrl;

            // Create basic skuDetails if not present
            if (!doc.skuDetails || !Array.isArray(doc.skuDetails) || doc.skuDetails.length === 0) {
                doc.skuDetails = [{
                    _id: product._id + '_default',
                    price: doc.price,
                    validity: 365, // Default to 1 year validity
                    lifetime: false,
                    stripePriceId: 'price_default'
                }];
            }

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
        // Get product and populate reviews
        const product = await Product.findById(req.params.id)
            .populate({
                path: 'reviews',
                options: { sort: { createdAt: -1 } }
            });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Convert to plain object and ensure inStock is correctly set
        const productData = product.toObject();
        productData.inStock = productData.stock > 0;

        // Add necessary fields for frontend compatibility
        productData.image = productData.imageUrl; // Frontend expects 'image' field

        // Create basic skuDetails if not present
        if (!productData.skuDetails || !Array.isArray(productData.skuDetails) || productData.skuDetails.length === 0) {
            productData.skuDetails = [{
                _id: product._id + '_default',
                price: productData.price,
                validity: 365, // Default to 1 year validity
                lifetime: false,
                stripePriceId: 'price_default' // This would need to be set correctly in production
            }];
        }

        // Rename reviews to feedbackDetails for frontend compatibility
        if (productData.reviews) {
            productData.feedbackDetails = productData.reviews;
        }

        // Find related products (same category, but not the same product)
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id } // exclude current product
        }).limit(4);

        // Process related products to ensure they have the same structure
        const processedRelatedProducts = relatedProducts.map(relatedProduct => {
            const relatedProductData = relatedProduct.toObject();
            relatedProductData.inStock = relatedProductData.stock > 0;
            relatedProductData.image = relatedProductData.imageUrl;

            // Create basic skuDetails if not present for related products
            if (!relatedProductData.skuDetails || !Array.isArray(relatedProductData.skuDetails) || relatedProductData.skuDetails.length === 0) {
                relatedProductData.skuDetails = [{
                    _id: relatedProduct._id + '_default',
                    price: relatedProductData.price,
                    validity: 365,
                    lifetime: false,
                    stripePriceId: 'price_default'
                }];
            }

            return relatedProductData;
        });

        // Structure the response to match what frontend expects
        res.status(200).json({
            success: true,
            product: productData,
            result: {
                product: productData,
                relatedProducts: processedRelatedProducts
            }
        });
    } catch (error) {
        console.error('Error fetching product by ID:', error);
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

// @desc    Get product count for admin statistics
// @route   GET /products/count
// @access  Private/Admin
exports.getProductCount = async (req, res) => {
    try {
        const count = await Product.countDocuments();

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update product stock
// @route   PUT /products/:id/stock
// @access  Private
exports.updateProductStock = async (req, res) => {
    try {
        const { quantity } = req.body;

        if (quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Quantity is required'
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Calculate new stock value
        const newStock = product.stock + quantity;

        // Prevent negative stock
        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Update stock and inStock flag
        product.stock = newStock;
        product.inStock = newStock > 0;

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Product stock updated',
            product: {
                id: product._id,
                stock: product.stock,
                inStock: product.inStock
            }
        });
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 