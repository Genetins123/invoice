const mongoose = require('mongoose');

// Schema for each item line in the invoice
const invoiceItemSchema = new mongoose.Schema({
    productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true }, // Price per unit
    discountPercent: { type: Number, default: 0 },
    amount: { type: Number, required: true }, // Quantity
    totalLineItem: { type: Number, required: true }, // Calculated sub-total for this item
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: Number, unique: true, required: true }, 
    date: { type: Date, default: Date.now },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true }, // Link to Client
    items: [invoiceItemSchema],
    notes: { type: String },
    
    // Total fields (THESE CAUSED THE ERROR BECAUSE THEY WERE MISSING IN THE PAYLOAD)
    totalWithoutVAT: { type: Number, required: true },
    totalVAT: { type: Number, required: true },
    total: { type: Number, required: true }, // Final Total
    
    status: { type: String, enum: ['Paid', 'Not Paid', 'Due'], default: 'Due' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);