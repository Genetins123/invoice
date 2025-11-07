const express = require('express');
const Client = require('../models/Client'); 

const router = express.Router();

// ------------------------------------------------------------------
// --- CREATE (POST)
// ------------------------------------------------------------------
// POST /api/clients: Add New Client
router.post('/', async (req, res) => {
    try {
        const newClient = new Client(req.body);
        const savedClient = await newClient.save();
        res.status(201).json(savedClient); 
    } catch (error) {
        res.status(400).json({ message: 'Error adding client', error: error.message });
    }
});

// ------------------------------------------------------------------
// --- READ (GET)
// ------------------------------------------------------------------

// GET /api/clients: Get All Clients (sorted by most recent update)
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find({}).sort({ updatedAt: -1 });
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching clients', error: error.message });
    }
});

// GET /api/clients/:id: Get Single Client by ID
router.get('/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        
        if (!client) {
            // Return 404 if the client ID is valid but not found
            return res.status(404).json({ message: 'Client not found' });
        }
        
        res.status(200).json(client);
    } catch (error) {
        // Return 400 for bad ID format (e.g., not a valid MongoDB ObjectId)
        res.status(400).json({ message: 'Error fetching client', error: error.message });
    }
});

// ------------------------------------------------------------------
// --- UPDATE (PUT)
// ------------------------------------------------------------------
// PUT /api/clients/:id: Update an Existing Client
router.put('/:id', async (req, res) => {
    try {
        // FindByIdAndUpdate options:
        // { new: true } returns the updated document.
        // { runValidators: true } ensures schema validation runs on the update.
        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } 
        );

        if (!updatedClient) {
            return res.status(404).json({ message: 'Client not found' });
        }

        res.status(200).json(updatedClient);
    } catch (error) {
        // Handle validation errors (e.g., trying to set a non-unique email) or bad ID format
        res.status(400).json({ message: 'Error updating client', error: error.message });
    }
});

// ------------------------------------------------------------------
// --- DELETE (DELETE)
// ------------------------------------------------------------------
// DELETE /api/clients/:id: Delete a Client
router.delete('/:id', async (req, res) => {
    try {
        const deletedClient = await Client.findByIdAndDelete(req.params.id);

        if (!deletedClient) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Return a 200 status with a confirmation message and the deleted document
        res.status(200).json({ message: 'Client successfully deleted', client: deletedClient });
        
    } catch (error) {
        // Handle bad ID format
        res.status(400).json({ message: 'Error deleting client', error: error.message });
    }
});

module.exports = router;
