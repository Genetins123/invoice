const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    address: { type: String },
    phone: { type: String },
    businessNumber: { type: String, unique: true, sparse: true },
    website: { type: String },
    
    // ⭐️ NEW CRITICAL FIELD: Links the client to the user who created it
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Client', clientSchema);