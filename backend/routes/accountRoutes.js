// routes/accountRoutes.js

const express = require('express');
const { 
    createAccount, 
    getAccounts, 
    updateAccount, 
    deleteAccount 
} = require('../controllers/accountController');

const router = express.Router();

// Routes for handling collections (GET all, POST create)
router.route('/')
    .get(getAccounts)      // GET /api/accounts
    .post(createAccount);  // POST /api/accounts

// Routes for handling single documents (GET by ID, PUT update, DELETE)
router.route('/:id')
    // .get(getAccount) // You could add a get single account route here
    .put(updateAccount)    // PUT /api/v1/accounts/:id
    .delete(deleteAccount);// DELETE /api/v1/accounts/:id

module.exports = router;