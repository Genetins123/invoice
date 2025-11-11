// models/Account.js

const mongoose = require('mongoose');

// Define the schema for the Account
const AccountSchema = new mongoose.Schema({
    // Account No (Example: ACC1234567890)
    accountNo: {
        type: String,
        required: [true, 'Account number is required'],
        unique: true, // Ensures no two accounts have the same number
        trim: true
    },
    // Name (Example: Company Sales Account)
    name: {
        type: String,
        required: [true, 'Account name is required'],
        trim: true
    },
    // Balance (Example: 98450.00)
    balance: {
        type: Number,
        required: [true, 'Initial Balance is required'],
        default: 0,
        min: 0 // Balance should not be negative
    },
    // Note/Description
    note: {
        type: String,
        trim: true,
        default: ''
    },
    // Timestamp for creation
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create and export the Account Model
module.exports = mongoose.model('Account', AccountSchema);