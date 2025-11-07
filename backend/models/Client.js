const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    address: { type: String },
    phone: { type: String },
    businessNumber: { type: String, unique: true, sparse: true },
    website: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
