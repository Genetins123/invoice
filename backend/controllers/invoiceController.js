// ... inside the createInvoice function

// 1. Basic check for required fields in the request body
if (!req.body.clientId || !req.body.lineItems || req.body.lineItems.length === 0) {
    return res.status(400).json({ message: 'Missing required fields: clientId and at least one line item are mandatory.' });
}

try {
    // 2. Mongoose Save (the part that is likely failing)
    const newInvoice = new Invoice(req.body);
    const savedInvoice = await newInvoice.save(); 
    
    // ... success response
    res.status(201).json({ message: 'Invoice created successfully', invoice: savedInvoice });
} catch (error) {
    // 3. Log the detailed Mongoose error for debugging
    console.error('Mongoose Invoice Save Error:', error.message); 
    // Return a 500 status for internal server error
    res.status(500).json({ message: 'Error saving invoice', detail: error.message }); 
}
