const express = require('express');
const { 
    createAccount, 
    getAccounts, 
    updateAccount, 
    deleteAccount 
} = require('../controllers/accountController');
const { protect } = require('../middleware/auth'); // Assuming this path is correct

const router = express.Router();

// Routes for handling collections (GET all, POST create)
router.route('/')
    .get(protect, getAccounts)      // GET /api/accounts (Protected)
    .post(protect, createAccount);  // POST /api/accounts (Protected)

// Routes for handling single documents (PUT update, DELETE)
router.route('/:id')
    .put(protect, updateAccount)    // PUT /api/v1/accounts/:id (Protected)
    .delete(protect, deleteAccount);// DELETE /api/v1/accounts/:id (Protected)

module.exports = router;