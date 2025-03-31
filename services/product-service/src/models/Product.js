const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    imageCollection: {
        type: [{
            url: String

        }], required: true
    },
    brand: { type: String, required: true },
    colors: { type: [String], required: true },
    sizes: { type: [Number], required: true }
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
