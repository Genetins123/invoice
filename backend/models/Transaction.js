const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Income', 'Expense'],
        required: [true, 'Transaction type is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0.01
    },
    accountId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Account',
        required: [true, 'Account ID is required']
    },
    // The Client ID links this transaction to a specific client document
    clientId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Client', // ⭐ Make sure you have a Client model defined with this name!
        required: [true, 'Client ID is required for this transaction type/source'] // Changed comment for clarity
    },
    source: {
        type: String,
        trim: true,
        // The source can be used as a fallback or if the transaction isn't linked to a formal Client document
        required: [true, 'Source/Payee is required']
    },
    // Store the payment method
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'Card', 'Cheque'],
        required: [true, 'Payment method is required']
    },
    reference: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);