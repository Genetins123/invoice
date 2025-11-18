const Transaction = require('../models/Transaction');
const Account = require('../models/Account'); 

// --- CREATE Transaction (POST /api/transactions) (Protected) ---
exports.createTransaction = async (req, res) => {
    // ⭐️ ISOLATION: Get the user ID from the authentication middleware
    const ownerId = req.user.id; 
    
    try {
        const { type, amount, accountId, source, paymentMethod, date, reference, clientId } = req.body;

        // 1. Create the Transaction
        const transaction = await Transaction.create({
            type,
            amount,
            accountId,
            clientId, 
            owner: ownerId, // ⭐️ ISOLATION: Assign the owner
            source,
            paymentMethod,
            date,
            reference
        });

        // 2. Update the associated Account balance atomically
        // The Account.updateAccountBalance method now ensures the account belongs to the ownerId
        await Account.updateAccountBalance(accountId, ownerId, amount, type);

        // 3. Respond with success
        res.status(201).json({ 
            success: true, 
            data: transaction 
        });

    } catch (err) {
        console.error('Transaction creation error:', err.message); 
        // Handle potential errors from updateAccountBalance or Transaction validation
        res.status(400).json({ 
            success: false, 
            error: err.message || 'Transaction could not be recorded.' 
        });
    }
};

// --- GET All Transactions (GET /api/transactions) (Protected) ---
// @desc    Get all transactions, populated with account and client details, for the logged-in user
// @route   GET /api/transactions
// @access  Protected
exports.getTransactions = async (req, res) => {
    // ⭐️ ISOLATION: Filter by the authenticated user's ID
    const ownerId = req.user.id;
    
    try {
        // ⭐️ ISOLATION: Find transactions where 'owner' matches 'ownerId'
        const transactions = await Transaction.find({ owner: ownerId })
            // Populate the account field (Account will also be filtered by owner via security rules if applicable, 
            // but the query here ensures the transaction itself is theirs)
            .populate('accountId', 'name accountNo') 
            .populate('clientId', 'name email phone address') 
            .sort({ date: -1 }); 

        return res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error: Could not retrieve transactions.'
        });
    }
};

// --- DELETE Transaction (DELETE /api/transactions/:id) (Protected) ---
// @desc    Delete a transaction and reverse its effect on the account balance
// @route   DELETE /api/transactions/:id
// @access  Protected
exports.deleteTransaction = async (req, res) => {
    // ⭐️ ISOLATION: Get the user ID
    const ownerId = req.user.id;
    const transactionId = req.params.id;
    
    try {
        // 1. Find the transaction by ID AND owner ID
        const transaction = await Transaction.findOne({ _id: transactionId, owner: ownerId });

        if (!transaction) {
            return res.status(404).json({ success: false, error: 'Transaction not found or access denied' });
        }
        
        const { type, amount, accountId } = transaction;

        // 2. Determine the reversal type (Income becomes Expense, Expense becomes Income)
        const reversalType = type === 'Income' ? 'Expense' : 'Income';

        // 3. Reverse the account balance using the atomic, isolated method
        // We use the reversalType to negate the original effect.
        await Account.updateAccountBalance(accountId, ownerId, amount, reversalType);
        
        // 4. Delete the transaction
        await transaction.deleteOne();

        // 5. Respond with success
        res.status(200).json({ 
            success: true, 
            data: {} 
        });

    } catch (err) {
        console.error('Transaction deletion error:', err.message);
        res.status(500).json({ 
            success: false, 
            error: 'Server Error: Transaction could not be deleted or balance reversal failed.' 
        });
    }
}; 