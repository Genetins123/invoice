const express = require('express');
// Import all three controller functions
const { createTransaction, getTransactions, deleteTransaction } = require('../controllers/transactionController'); 
const { protect } = require('../middleware/auth'); // Assuming this path is correct

const router = express.Router();

// Route: /api/transactions
router.route('/')
    .get(protect, getTransactions) // GET all transactions (Protected)
    .post(protect, createTransaction); // POST a new transaction (Protected)

// Route: /api/transactions/:id
router.route('/:id')
    // DELETE a specific transaction (Protected)
    .delete(protect, deleteTransaction); 

module.exports = router; 