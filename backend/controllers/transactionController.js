const Transaction = require('../models/Transaction');
const Account = require('../models/Account'); // Imports the compiled Account Model

// --- CREATE Transaction (POST /api/transactions) ---
exports.createTransaction = async (req, res) => {
    const { amount, accountId, type, source, reference, date } = req.body;
    
    if (!amount || !accountId || !type) {
        return res.status(400).json({ success: false, error: 'Missing required fields for transaction.' });
    }

    try {
        // 1. Create the Transaction record
        const transaction = await Transaction.create({
            type,
            amount,
            accountId,
            source,
            reference,
            date
        });

        // 2. Update the associated Account balance using the static method
        await Account.updateAccountBalance(accountId, amount, type);

        res.status(201).json({ success: true, data: transaction });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Server Error while processing transaction.' });
    }
};

// --- GET All Transactions (GET /api/transactions) ---
// @desc    Get all transactions, populated with account details
// @route   GET /api/transactions
// @access  Public
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            // ⭐ Populate the account field to display the account name and number
            .populate('accountId', 'name accountNo') 
            .sort({ date: -1 }); // Show newest first

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

