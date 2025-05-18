const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.put('/logout', userController.logoutUser);

// Stats routes
router.get('/count', userController.getUserCount);

// Private routes
router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);

// Admin routes
router.get('/admin/users', protect, admin, userController.getUsers);
router.get('/admin/users/:id', protect, admin, userController.getUserById);
router.put('/admin/users/:id', protect, admin, userController.updateUser);
router.delete('/admin/users/:id', protect, admin, userController.deleteUser);
router.put('/admin/users/:id/role', protect, admin, userController.updateUserRole);
router.put('/admin/users/:id/status', protect, admin, userController.updateUserStatus);

// Phone update route - accessible without protection for the order service
router.put('/users/:id/phone', userController.updateUserPhone);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'user-service' });
});

module.exports = router; 