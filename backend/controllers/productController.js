const Product = require('../models/Product'); // Path relative to the controller file

/**
 * Helper function to calculate price without VAT for the API response.
 * This is not stored in the DB, but useful for the frontend.
 */
const calculateResponseData = (product) => {
    // Ensure we are working with a plain JavaScript object
    const productObj = product.toObject ? product.toObject() : product;
    const { price, vatPercent } = productObj;

    if (vatPercent > 0) {
        productObj.priceWithoutVat = price / (1 + vatPercent / 100);
    } else {
        productObj.priceWithoutVat = price;
    }
    return productObj;
};

// --- 1. CREATE Product ---
exports.createProduct = async (req, res) => {
    try {
        // Explicitly extract and map fields: frontend sends 'vat', schema expects 'vatPercent'
        const { name, barcode, price, vat } = req.body;
        
        const productData = {
            name,
            barcode,
            price,
            vatPercent: vat, // Mapping the field name
        };

        const newProduct = new Product(productData);
        const savedProduct = await newProduct.save();

        // Send back the product with the calculated priceWithoutVat
        const responseData = calculateResponseData(savedProduct);
        
        res.status(201).json(responseData);

    } catch (error) {
        console.error("Server Error on Product CREATE:", error.message);
        
        let status = 400;
        let message = 'Error adding product.';

        if (error.code === 11000) { // MongoDB duplicate key error (for barcode)
            message = 'Barcode already exists. Barcode must be unique.';
        } else if (error.name === 'ValidationError') {
            // Mongoose validation errors
            message = error.message; 
        }

        res.status(status).json({ message: message, error: error.message });
    }
};

// --- 2. READ ALL Products ---
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ name: 1 }); // Sort alphabetically
        
        // Calculate priceWithoutVat for every product before sending
        const productsWithCalculatedData = products.map(calculateResponseData);

        res.status(200).json(productsWithCalculatedData);
    } catch (error) {
        console.error("Server Error on Product READ ALL:", error.message);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// --- 3. READ ONE Product by ID ---
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const responseData = calculateResponseData(product);

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Server Error on Product READ ONE:", error.message);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

// --- 4. UPDATE Product by ID ---
exports.updateProduct = async (req, res) => {
    try {
        const updateData = {};
        // Only include fields that are present in the request body
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.barcode !== undefined) updateData.barcode = req.body.barcode;
        if (req.body.price !== undefined) updateData.price = req.body.price;
        // Map frontend 'vat' to schema's 'vatPercent' if present
        if (req.body.vat !== undefined) updateData.vatPercent = req.body.vat;
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true } // Return new doc and run schema validators
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found for update' });
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

// --- 5. DELETE Product by ID ---
exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found for deletion' });
        }

        res.status(200).json({ message: 'Product deleted successfully', id: req.params.id });

    } catch (error) {
        console.error("Server Error on Product DELETE:", error.message);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};
