const Product = require('../models/Product'); // Path relative to the controller file

/**
 * Helper function to calculate price without VAT for the API response.
 */
const calculateResponseData = (product) => {
    // Ensure we are working with a plain JavaScript object
    const productObj = product.toObject ? product.toObject() : product;
    const { price, vatPercent } = productObj;

    if (vatPercent > 0) {
        // Calculate price without VAT
        productObj.priceWithoutVat = parseFloat((price / (1 + vatPercent / 100)).toFixed(2));
    } else {
        productObj.priceWithoutVat = price;
    }
    return productObj;
};

// --- 1. CREATE Product (Isolation Added) ---
exports.createProduct = async (req, res) => {
    try {
        // ⭐️ CRITICAL: Get the user ID from the authentication middleware
        const ownerId = req.user.id; 
        
        const { name, barcode, price, vat } = req.body;
        
        const productData = {
            name,
            barcode,
            price,
            vatPercent: vat, 
            owner: ownerId, // ⭐️ NEW: Assign the logged-in user as the product owner
        };

        const newProduct = new Product(productData);
        const savedProduct = await newProduct.save();

        const responseData = calculateResponseData(savedProduct);
        
        res.status(201).json(responseData);

    } catch (error) {
        console.error("Server Error on Product CREATE:", error.message);
        
        let status = 400;
        let message = 'Error adding product.';

        if (error.code === 11000) { 
            message = 'Barcode already exists. Barcode must be unique.';
        } else if (error.name === 'ValidationError') {
            message = error.message; 
        }

        res.status(status).json({ message: message, error: error.message });
    }
};

// --- 2. READ ALL Products (Isolation Added) ---
exports.getProducts = async (req, res) => {
    try {
        // ⭐️ CRITICAL: Filter products to show only those owned by the logged-in user
        const ownerId = req.user.id; 
        
        // Find products where the 'owner' field matches the authenticated user's ID
        const products = await Product.find({ owner: ownerId }).sort({ name: 1 }); 
        
        // Calculate priceWithoutVat for every product before sending
        const productsWithCalculatedData = products.map(calculateResponseData);

        res.status(200).json(productsWithCalculatedData);
    } catch (error) {
        console.error("Server Error on Product READ ALL:", error.message);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// --- 3. READ ONE Product by ID (Isolation Added) ---
exports.getProductById = async (req, res) => {
    try {
        // ⭐️ CRITICAL: Find the product by ID AND ensure the owner matches the logged-in user
        const ownerId = req.user.id; 

        const product = await Product.findOne({ 
            _id: req.params.id, 
            owner: ownerId // Ensures User A cannot fetch User B's product
        });

        if (!product) {
            // Return 404 if product doesn't exist OR if it exists but belongs to a different user
            return res.status(404).json({ message: 'Product not found or access denied' });
        }
        
        const responseData = calculateResponseData(product);

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Server Error on Product READ ONE:", error.message);
        // Handle MongoDB ObjectId cast errors (e.g., if ID format is wrong)
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid product ID format.' });
        }
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

// --- 4. UPDATE Product by ID (Isolation Added) ---
exports.updateProduct = async (req, res) => {
    try {
        const ownerId = req.user.id; 
        const productId = req.params.id;

        const updateData = {};
        // Only include fields that are present in the request body
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.barcode !== undefined) updateData.barcode = req.body.barcode;
        if (req.body.price !== undefined) updateData.price = req.body.price;
        if (req.body.vat !== undefined) updateData.vatPercent = req.body.vat; // Map 'vat' to 'vatPercent'
        
        // ⭐️ CRITICAL: Find and update the product by ID AND owner ID
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: productId, owner: ownerId }, // Filter by both ID and Owner
            { $set: updateData },
            { new: true, runValidators: true } 
        );

        if (!updatedProduct) {
             return res.status(404).json({ message: 'Product not found or access denied for update' });
        }

        const responseData = calculateResponseData(updatedProduct);

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Server Error on Product UPDATE:", error.message);
        
        let status = 400;
        let message = 'Error updating product.';
        
        if (error.code === 11000) { 
            message = 'Barcode already exists. Barcode must be unique.';
        } else if (error.name === 'ValidationError') {
            message = error.message; 
        }

        res.status(status).json({ message: message, error: error.message });
    }
};

// --- 5. DELETE Product by ID (Isolation Added) ---
exports.deleteProduct = async (req, res) => {
    try {
        const ownerId = req.user.id; 
        const productId = req.params.id;

        // ⭐️ CRITICAL: Delete the product by ID AND owner ID
        const deletedProduct = await Product.findOneAndDelete({
            _id: productId,
            owner: ownerId // Ensures user can only delete their own products
        });

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found or access denied for deletion' });
        }

        res.status(200).json({ message: 'Product deleted successfully', id: productId });

    } catch (error) {
        console.error("Server Error on Product DELETE:", error.message);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};