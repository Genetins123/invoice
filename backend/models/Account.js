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
    // ⭐️ NEW CRITICAL FIELD: Links the account to the user who created it
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model
        required: true 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * STATIC METHOD: updateAccountBalance
 * Safely adjusts the account balance using the MongoDB $inc operator.
 * ⭐️ MODIFIED: Now requires ownerId for isolated updates.
 */
AccountSchema.statics.updateAccountBalance = async function(accountId, ownerId, amount, type) {
    const change = type === 'Income' ? amount : -amount; // Income adds, Expense subtracts

    try {
        const result = await this.findOneAndUpdate(
            // ⭐️ ISOLATION FILTER: Ensure we update the account by ID AND owner
            { _id: accountId, owner: ownerId },
            { $inc: { balance: change } },
            { new: true }
        );
        
        if (!result) {
            throw new Error('Account not found or access denied for balance update.');
        }

        console.log(`[Transaction] Account ${accountId} balance updated by ${change}.`);
    } catch (err) {
        console.error(`Error updating account balance for ${accountId}: ${err.message}`);
        // Re-throw to be handled by the calling function (e.g., transaction controller)
        throw new Error(`Failed to update account balance: ${err.message}`); 
    }
};

// Compile and export the Account Model
module.exports = mongoose.model('Account', AccountSchema);