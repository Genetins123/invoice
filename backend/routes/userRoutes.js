const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// protect middleware is NOT required/imported

// Routes
router.post('/register', userController.registerUser);
router.post("/login", userController.loginUser); 

router.get('/', userController.getAllUsers);

// ⭐️ UPDATE ROUTE: Unprotected, moved up for priority matching
router.put('/:id', userController.updateUser); 

router.get('/:id', userController.getUserById);

router.delete('/:id', userController.deleteUser);

module.exports = router;