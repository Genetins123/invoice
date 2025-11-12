const express = require('express');
// Import all three controller functions
const { createTransaction, getTransactions, deleteTransaction } = require('../controllers/transactionController'); 

const router = express.Router();

// Route: /api/transactions
router.route('/')
    .get(getTransactions) // GET all transactions
    .post(createTransaction); // POST a new transaction

// Route: /api/transactions/:id
router.route('/:id')
    // DELETE a specific transaction
    .delete(deleteTransaction); 

module.exports = router;