// backend/models/Transaction.js

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
    // Reference to the Account model
    accountId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Account',
        required: [true, 'Account ID is required']
    },
    source: {
        type: String,
        trim: true,
        required: [true, 'Source/Payee is required']
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