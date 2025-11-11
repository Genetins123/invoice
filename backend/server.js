const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Ensure you have installed this: npm install cors

dotenv.config(); 

// --- 1. Import Routes ---
const productRoutes = require('./routes/productRoutes'); 
const clientRoutes = require('./routes/clientRoutes'); 
const invoiceRoutes = require('./routes/invoiceRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const accountRoutes = require('./routes/accountRoutes');


const app = express();

// --- 2. Middleware Setup (CRITICAL FIX) ---
app.use(cors()); 

// ⭐️ FIX: These two lines are essential for parsing req.body in PUT/POST requests
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: false })); // Parses URL-encoded bodies

// --- 3. Database Connection Function ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1); 
    }
};

connectDB();

// --- 4. Define API Endpoints ---
app.get('/', (req, res) => {
    res.send('Invoice System API is running successfully!');
});

// Mount the specific resource routes
app.use('/api/user', userRoutes);          
app.use('/api/products', productRoutes); 
app.use('/api/clients', clientRoutes);   
app.use('/api/invoices', invoiceRoutes); 
app.use('/api/accounts', accountRoutes);
// --- 5. Start the Server ---
const PORT = process.env.PORT || 5000;

app.listen(
    PORT, 
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);