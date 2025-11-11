// controllers/accountController.js

const Account = require('../models/Account');

// --- 1. CREATE (C) ---
/**
 * @desc    Create a new account (Used by the AddAccountForm)
 * @route   POST /api/v1/accounts
 * @access  Public (Should be Private/Auth-protected in a real app)
 */
exports.createAccount = async (req, res) => {
    try {
        const { accountNo, name, initialBalance, note } = req.body;

        if (!accountNo || !name || initialBalance === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide account number, name, and initial balance.' 
            });
        }

        const account = await Account.create({
            accountNo,
            name,
            balance: initialBalance, // Maps initialBalance from form to 'balance' in the model
            note
        });

        res.status(201).json({
            success: true,
            data: account
        });

    } catch (err) {
        // Handle Mongoose unique constraint error (e.g., duplicate accountNo)
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Account number already exists.' });
        }
        
        // Handle validation errors or general server errors
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Server Error' 
        });
    }
};

// --- 2. READ (R) ---
/**
 * @desc    Get all accounts (Used to populate the AccountsTable)
 * @route   GET /api/v1/accounts
 * @access  Public
 */
exports.getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find().sort({ createdAt: 1 }); // Fetches all and sorts by creation date

        res.status(200).json({
            success: true,
            count: accounts.length,
            data: accounts
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: 'Server Error: Could not retrieve accounts' 
        });
    }
};

// --- 3. UPDATE (U) ---
/**
 * @desc    Update a single account by ID
 * @route   PUT /api/v1/accounts/:id
 * @access  Public
 */
exports.updateAccount = async (req, res) => {
    try {
        let account = await Account.findById(req.params.id);

        if (!account) {
            return res.status(404).json({ success: false, error: 'Account not found' });
        }
        
        // Find by ID and update the document, returning the modified document
        account = await Account.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true // Run schema validation on the update
        });

        res.status(200).json({
            success: true,
            data: account
        });

    } catch (err) {
        // Handle server errors (e.g., invalid ID format)
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Server Error: Could not update account' 
        });
    }
};


// --- 4. DELETE (D) ---
/**
 * @desc    Delete a single account by ID
 * @route   DELETE /api/v1/accounts/:id
 * @access  Public
 */
exports.deleteAccount = async (req, res) => {
    try {
        const account = await Account.findById(req.params.id);

        if (!account) {
            return res.status(404).json({ success: false, error: 'Account not found' });
        }

        await account.deleteOne();

        res.status(200).json({
            success: true,
            data: {} // Return an empty object or status message on success
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: 'Server Error: Could not delete account' 
        });
    }
};