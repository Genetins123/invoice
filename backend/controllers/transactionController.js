const Transaction = require('../models/Transaction');
const Account = require('../models/Account'); // Imports the compiled Account Model

// --- CREATE Transaction (POST /api/transactions) ---
exports.createTransaction = async (req, res) => {
    try {
        // ⭐ UPDATED: Include clientId in destructuring
        const { type, amount, accountId, source, paymentMethod, date, reference, clientId } = req.body;

        // 1. Create the Transaction
        const transaction = await Transaction.create({
            type,
            amount,
            accountId,
            // ⭐ UPDATED: Include the clientId in the creation
            clientId, 
            source,
            paymentMethod,
            date,
            reference
        });

        // 2. Update the associated Account balance
        const account = await Account.findById(accountId);

        if (!account) {
            return res.status(404).json({ success: false, error: 'Account not found' });
        }

        if (type === 'Income') {
            account.balance += amount;
        } else if (type === 'Expense') {
            account.balance -= amount;
        }

        await account.save(); // Save the updated balance

        // 3. Respond with success
        res.status(201).json({ 
            success: true, 
            data: transaction 
        });

    } catch (err) {
        // Log the actual validation/server error for debugging
        console.error('Transaction creation error:', err.message); 
        // Send a generic error response back to the frontend
        res.status(400).json({ 
            success: false, 
            error: err.message || 'Transaction could not be recorded.' 
        });
    }
};

// --- GET All Transactions (GET /api/transactions) ---
// @desc    Get all transactions, populated with account and client details
// @route   GET /api/transactions
// @access  Public
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            // Populate the account field
            .populate('accountId', 'name accountNo') 
            // ⭐ NEW: Populate the client field to get client details
            .populate('clientId', 'name email phone address') 
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

// --- DELETE Transaction (DELETE /api/transactions/:id) ---
// @desc    Delete a transaction and reverse its effect on the account balance
// @route   DELETE /api/transactions/:id
// @access  Private (Requires authentication in a real app)
exports.deleteTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        
        // 1. Find the transaction to get its details before deletion
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }
        
        const { type, amount, accountId } = transaction;

        // 2. Reverse the account balance change
        const account = await Account.findById(accountId);

        if (!account) {
             // Log but proceed to delete the transaction if the account is somehow missing
             console.warn(`Account ID ${accountId} not found for transaction ${transactionId}. Deleting transaction without balance reversal.`);
        } else {
            // Reversal logic:
            // If it was Income, subtract the amount.
            // If it was Expense, add the amount back.
            if (type === 'Income') {
                account.balance -= amount; 
            } else if (type === 'Expense') {
                account.balance += amount; 
            }
            
            await account.save(); // Save the updated balance
        }

        // 3. Delete the transaction
        await transaction.deleteOne(); // Use deleteOne on the document instance

        // 4. Respond with success
        res.status(200).json({ 
            success: true, 
            data: {} // Empty data or ID of the deleted item
        });

    } catch (err) {
        console.error('Transaction deletion error:', err.message);
        // Mongoose cast errors (e.g., invalid ID format) are handled here
        res.status(500).json({ 
            success: false, 
            error: 'Server Error: Transaction could not be deleted.' 
        });
    }
};