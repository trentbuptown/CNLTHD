const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/digizone', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Sample products
const computerProducts = [
    {
        name: 'Dell XPS 15',
        description: 'High-performance laptop with 15" display',
        price: 1499.99,
        category: 'Computer',
        platformType: 'Windows',
        brand: 'Dell',
        stock: 10,
        imageUrl: 'https://i.imgur.com/JGsKxBe.jpg',
        avgRating: 4.5,
        reviewCount: 24
    },
    {
        name: 'MacBook Pro M1',
        description: 'Pro laptop with Apple M1 chip',
        price: 1299.99,
        category: 'Computer',
        platformType: 'Mac',
        brand: 'Apple',
        stock: 15,
        imageUrl: 'https://i.imgur.com/9JvFtZ9.jpg',
        avgRating: 4.8,
        reviewCount: 32
    }
];

const mobileProducts = [
    {
        name: 'iPhone 15 Pink',
        description: 'Latest iPhone with A17 chip',
        price: 999.99,
        category: 'Mobile',
        platformType: 'iOS',
        brand: 'Apple',
        stock: 20,
        imageUrl: 'https://i.imgur.com/qrtXDrO.jpg',
        avgRating: 4.7,
        reviewCount: 18
    },
    {
        name: 'Samsung Galaxy S23 Ultra',
        description: 'Flagship Android smartphone with S Pen',
        price: 1199.99,
        category: 'Mobile',
        platformType: 'Android',
        brand: 'Samsung',
        stock: 12,
        imageUrl: 'https://i.imgur.com/bFBhmBQ.jpg',
        avgRating: 4.6,
        reviewCount: 15
    }
];

// Insert products
const seedDatabase = async () => {
    try {
        // Clear existing products with these categories
        await Product.deleteMany({ category: { $in: ['Computer', 'Mobile'] } });

        // Insert new products
        await Product.insertMany(computerProducts);
        await Product.insertMany(mobileProducts);

        console.log('Database seeded successfully');
        process.exit();
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedDatabase(); 