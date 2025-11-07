const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables (like MONGO_URI and PORT) from .env file
dotenv.config(); 

// --- 1. Import Routes ---
// Make sure you have created these files in backend/routes/
const productRoutes = require('./routes/productRoutes'); 
const clientRoutes = require('./routes/clientRoutes'); 
const invoiceRoutes = require('./routes/invoiceRoutes'); 

const app = express();

// --- 2. Middleware Setup ---
// Enable CORS for frontend communication (optional, but needed for development)
// Install: npm install cors
const cors = require('cors');
app.use(cors()); 

// Middleware to parse JSON bodies from incoming requests (important for POST requests)
app.use(express.json()); 

// --- 3. Database Connection Function ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Log the error for debugging purposes
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        
        // Exit process with failure
        process.exit(1); 
    }
};

// Call the connection function to establish the DB connection
connectDB();

// --- 4. Define API Endpoints ---

// Basic welcome route
app.get('/', (req, res) => {
    res.send('Invoice System API is running successfully!');
});

// Mount the specific resource routes
app.use('/api/products', productRoutes); // Handled in backend/routes/productRoutes.js
app.use('/api/clients', clientRoutes);   // Handled in backend/routes/clientRoutes.js
app.use('/api/invoices', invoiceRoutes); // Handled in backend/routes/invoiceRoutes.js

// --- 5. Start the Server ---
const PORT = process.env.PORT || 5000;

app.listen(
    PORT, 
    // Console log will confirm the server is running
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);
