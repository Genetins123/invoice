// backend/models/Account.js

const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    accountNo: {
        type: String,
        required: [true, 'Account number is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Account name is required'],
        trim: true
    },
    balance: { 
        type: Number,
        required: [true, 'Initial Balance is required'],
        default: 0,
        min: 0 
    },
    note: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * STATIC METHOD: updateAccountBalance
 * Safely adjusts the account balance using the MongoDB $inc operator.
 */
AccountSchema.statics.updateAccountBalance = async function(accountId, amount, type) {
    const change = type === 'Income' ? amount : -amount; // Income adds, Expense subtracts

    try {
        await this.findByIdAndUpdate(accountId, {
            $inc: { balance: change } 
        });
        console.log(`[Transaction] Account ${accountId} balance updated by ${change}.`);
    } catch (err) {
        console.error(`Error updating account balance for ${accountId}: ${err.message}`);
    }
};

// Compile and export the Account Model
module.exports = mongoose.model('Account', AccountSchema);