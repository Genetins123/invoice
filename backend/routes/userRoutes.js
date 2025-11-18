const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth'); 

// --- PUBLIC ROUTES ---
router.post('/register', userController.registerUser);
router.post("/login", userController.loginUser); 

// --- PROTECTED USER ROUTES ---
// ⭐️ FIX: This must come before the dynamic /:id route
// The 'protect' middleware ensures req.user is available
router.get('/profile', protect, userController.getProfile); 

// Protected route for users to update their OWN profile
router.put('/profile', protect, userController.updateUserProfile); 


// --- ADMIN/GENERIC ROUTES (Should be heavily secured) ---
// These routes handle operations based on an ID passed in the URL parameter.
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser); 
router.delete('/:id', userController.deleteUser);


module.exports = router;