const Account = require('../models/Account');

// --- 1. CREATE (C) (Isolation Added) ---
/**
 * @desc    Create a new account
 * @route   POST /api/v1/accounts
 * @access  Private/Protected
 */
exports.createAccount = async (req, res) => {
    try {
        // ⭐️ ISOLATION: Get the user ID from the authentication middleware
        const ownerId = req.user.id;
        
        const { accountNo, name, initialBalance, note } = req.body;

        if (!accountNo || !name || initialBalance === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide account number, name, and initial balance.' 
            });
        }
        
        // ⭐️ IMPORTANT: Check if the accountNo is unique for THIS owner.
        // We will need to set up a compound index in the DB for this (see note below). 
        // For now, Mongoose's `unique: true` constraint will check across all owners,
        // which might be acceptable if account numbers must be globally unique, 
        // but typically they are unique per-user. 

        const account = await Account.create({
            accountNo,
            name,
            balance: initialBalance, 
            note,
            owner: ownerId, // ⭐️ NEW: Assign the logged-in user as the owner
        });

        res.status(201).json({
            success: true,
            data: account
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Account number already exists.' });
        }
        
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Server Error' 
        });
    }
};

// --- 2. READ (R) (Isolation Added) ---
/**
 * @desc    Get all accounts for the logged-in user
 * @route   GET /api/v1/accounts
 * @access  Private/Protected
 */
exports.getAccounts = async (req, res) => {
    try {
        // ⭐️ ISOLATION: Filter products to show only those owned by the logged-in user
        const ownerId = req.user.id; 
        
        // Find accounts where the 'owner' field matches the authenticated user's ID
        const accounts = await Account.find({ owner: ownerId }).sort({ createdAt: 1 }); 

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

// --- 3. UPDATE (U) (Isolation Added) ---
/**
 * @desc    Update a single account by ID
 * @route   PUT /api/v1/accounts/:id
 * @access  Private/Protected
 */
exports.updateAccount = async (req, res) => {
    try {
        const ownerId = req.user.id; 
        const accountId = req.params.id;

        // ⭐️ ISOLATION: Find by ID AND owner ID
        // Note: Balance is typically updated only via transactions, but name/note can be updated here.
        let account = await Account.findOneAndUpdate(
            { _id: accountId, owner: ownerId },
            req.body, 
            {
                new: true, // Return the updated document
                runValidators: true // Run schema validation on the update
            }
        );

        if (!account) {
            return res.status(404).json({ success: false, error: 'Account not found or access denied' });
        }

        res.status(200).json({
            success: true,
            data: account
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Server Error: Could not update account' 
        });
    }
};


// --- 4. DELETE (D) (Isolation Added) ---
/**
 * @desc    Delete a single account by ID
 * @route   DELETE /api/v1/accounts/:id
 * @access  Private/Protected
 */
exports.deleteAccount = async (req, res) => {
    try {
        const ownerId = req.user.id; 
        const accountId = req.params.id;

        // ⭐️ ISOLATION: Find and delete by ID AND owner ID
        const account = await Account.findOneAndDelete({ _id: accountId, owner: ownerId });

        if (!account) {
            return res.status(404).json({ success: false, error: 'Account not found or access denied' });
        }

        // We should ideally check if any transactions are tied to this account before deleting.
        // For simplicity, we skip that check here.

        res.status(200).json({
            success: true,
            data: {} 
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: 'Server Error: Could not delete account' 
        });
    }
};