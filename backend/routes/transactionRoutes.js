const express = require('express');
// ⭐ IMPORT BOTH FUNCTIONS
const { createTransaction, getTransactions } = require('../controllers/transactionController'); 

const router = express.Router();

router.route('/')
    // ⭐ NEW: Handle GET requests to fetch the list of transactions
    .get(getTransactions) 
    
    // Existing: Handle POST requests to create a new transaction
    .post(createTransaction); 

module.exports = router;