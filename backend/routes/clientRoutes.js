const express = require('express');
const Client = require('../models/Client'); 
// Assuming the path to your auth middleware is correct:
const { protect } = require('../middleware/auth'); 

const router = express.Router();

// ------------------------------------------------------------------
// --- CREATE (POST) - PROTECTED
// ------------------------------------------------------------------
// POST /api/clients: Add New Client
router.post('/', protect, async (req, res) => { // ⭐️ Added 'protect'
    try {
        // ⭐️ ISOLATION: Inject the logged-in user's ID as the owner
        const ownerId = req.user.id;
        const clientData = { ...req.body, owner: ownerId };

        const newClient = new Client(clientData);
        const savedClient = await newClient.save();
        res.status(201).json(savedClient); 
    } catch (error) {
        // Handle MongoDB duplicate key errors (for email/businessNumber)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A client with this email or business number already exists.', error: error.message });
        }
        res.status(400).json({ message: 'Error adding client', error: error.message });
    }
});

// ------------------------------------------------------------------
// --- READ (GET) - PROTECTED AND ISOLATED
// ------------------------------------------------------------------

// GET /api/clients: Get All Clients for the logged-in user
router.get('/', protect, async (req, res) => { // ⭐️ Added 'protect'
    try {
        // ⭐️ ISOLATION: Filter by the authenticated user's ID
        const ownerId = req.user.id;
        const clients = await Client.find({ owner: ownerId }).sort({ updatedAt: -1 }); // Only finds clients belonging to ownerId
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching clients', error: error.message });
    }
});

// GET /api/clients/:id: Get Single Client by ID
router.get('/:id', protect, async (req, res) => { // ⭐️ Added 'protect'
    try {
        const ownerId = req.user.id;
        
        // ⭐️ ISOLATION: Find by ID AND ensure the owner matches the logged-in user
        const client = await Client.findOne({ 
            _id: req.params.id,
            owner: ownerId 
        });
        
        if (!client) {
            // Returns 404 if client doesn't exist or if it belongs to another user
            return res.status(404).json({ message: 'Client not found or access denied' });
        }
        
        res.status(200).json(client);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching client', error: error.message });
    }
});

// ------------------------------------------------------------------
// --- UPDATE (PUT) - PROTECTED AND ISOLATED
// ------------------------------------------------------------------
// PUT /api/clients/:id: Update an Existing Client
router.put('/:id', protect, async (req, res) => { // ⭐️ Added 'protect'
    try {
        const ownerId = req.user.id;
        
        // ⭐️ ISOLATION: Find and update by ID AND owner ID
        const updatedClient = await Client.findOneAndUpdate(
            { _id: req.params.id, owner: ownerId }, // Filter by both ID and Owner
            req.body, 
            { new: true, runValidators: true } 
        );

        if (!updatedClient) {
            // Returns 404 if client doesn't exist or belongs to another user
            return res.status(404).json({ message: 'Client not found or access denied for update' });
        }

        res.status(200).json(updatedClient);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A client with this email or business number already exists.', error: error.message });
        }
        res.status(400).json({ message: 'Error updating client', error: error.message });
    }
});

// ------------------------------------------------------------------
// --- DELETE (DELETE) - PROTECTED AND ISOLATED
// ------------------------------------------------------------------
// DELETE /api/clients/:id: Delete a Client
router.delete('/:id', protect, async (req, res) => { // ⭐️ Added 'protect'
    try {
        const ownerId = req.user.id;
        
        // ⭐️ ISOLATION: Find and delete by ID AND owner ID
        const deletedClient = await Client.findOneAndDelete({ 
            _id: req.params.id,
            owner: ownerId // Ensures user can only delete their own clients
        });

        if (!deletedClient) {
            return res.status(404).json({ message: 'Client not found or access denied for deletion' });
        }

        res.status(200).json({ message: 'Client successfully deleted', client: deletedClient });
        
    } catch (error) {
        res.status(400).json({ message: 'Error deleting client', error: error.message });
    }
});

module.exports = router;