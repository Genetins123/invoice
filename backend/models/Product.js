const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Standard product fields
    name: { type: String, required: true, trim: true },
    barcode: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    vatPercent: { type: Number, default: 0, min: 0, max: 100 },

    // ⭐️ NEW CRITICAL FIELD: Links the product to the user who created it
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model
        required: true // Ensures every product must belong to a user
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Product', productSchema);