const mongoose = require('mongoose');

// Define the Product Schema
const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Product name is required.'], // Custom error message
        trim: true 
    },
    barcode: { 
        type: String, 
        unique: true, 
        required: [true, 'Barcode is required.'],
        trim: true,
        uppercase: true // Standardize barcode to uppercase
    },
    price: { 
        type: Number, 
        required: [true, 'Price is required.'],
        min: [0, 'Price cannot be negative.'] 
    },
    vatPercent: { 
        type: Number, 
        default: 18.00,
        min: [0, 'VAT percentage cannot be negative.'],
        max: [100, 'VAT percentage cannot exceed 100.']
    }, 
}, { 
    timestamps: true // Adds createdAt and updatedAt fields
});

// Export the Mongoose Model
module.exports = mongoose.model('Product', productSchema);
