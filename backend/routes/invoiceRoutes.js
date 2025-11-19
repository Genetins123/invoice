const express = require('express');
const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit'); 
const { protect } = require('../middleware/auth'); // ⭐ ADDED IMPORT
const router = express.Router();

// Helper to get the next Invoice Number
const getNextInvoiceNumber = async () => {
    const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
    return lastInvoice ? lastInvoice.invoiceNumber + 1 : 1001; 
};

// 1. POST /api/invoices: Create New Invoice
router.post('/', protect, async (req, res) => {
    try {
        const invoiceNumber = await getNextInvoiceNumber();
        
        // ⭐ RETRIEVE USER ID from authenticated request
        const userId = req.user.id; 

        const { clientId, lineItems, note, totalWithoutVAT, totalVAT, total } = req.body;

        const itemsForSchema = lineItems.map(item => ({
            productID: item.productID, 
            productName: item.productName,
            price: parseFloat(item.price), 
            discountPercent: parseFloat(item.discountPercent),
            amount: parseInt(item.amount),
            totalLineItem: parseFloat(item.totalLineItem),
        }));

        const newInvoice = new Invoice({
            invoiceNumber,
            client: clientId, 
            items: itemsForSchema,
            notes: note,
            
            // ⭐ SET THE OWNER
            owner: userId, 

            totalWithoutVAT: parseFloat(totalWithoutVAT),
            totalVAT: parseFloat(totalVAT),
            total: parseFloat(total),
        });

        const savedInvoice = await newInvoice.save();
        res.status(201).json({ message: 'Invoice saved successfully', invoice: savedInvoice });

    } catch (error) {
        console.error('Invoice Creation Error:', error);
        res.status(400).json({ message: 'Error saving invoice (Check required fields)', error: error.message });
    }
});

// 2. GET /api/invoices: Get All Invoices (List View)
router.get('/', protect, async (req, res) => {
    try {
        // ⭐ FILTER invoices by the logged-in user's ID
        const invoices = await Invoice.find({ owner: req.user.id }) 
            .select('invoiceNumber date client total status')
            .populate('client', 'name')
            .sort({ date: -1 });

        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices' });
    }
});

// 3. GET /api/invoices/:id: Get Single Invoice Detail
router.get('/:id', protect, async (req, res) => {
    try {
        // ⭐ FIND by ID AND OWNER to prevent unauthorized access
        const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user.id })
            .populate('client')
            .exec();

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' }); 
        }

        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching single invoice:', error);
        if (error.name === 'CastError') {
             return res.status(400).json({ message: 'Invalid Invoice ID format' });
        }
        res.status(500).json({ message: 'Error fetching invoice details', error: error.message });
    }
});

// 4. GET /api/invoices/:id/pdf: Generate Invoice PDF
router.get('/:id/pdf', protect, async (req, res) => {
    try {
        // ⭐ FIND by ID AND OWNER
        const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user.id }).populate('client');
        
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);
        doc.pipe(res);

        // --- Basic PDF Layout ---
        doc.fontSize(20).text(`INVOICE #${invoice.invoiceNumber}`, 50, 50);
        
        // Client Info
        doc.fontSize(10).text(`To: ${invoice.client.name}`, 50, 100);
        doc.text(`Address: ${invoice.client.address || 'N/A'}`);
        doc.text(`Business ID: ${invoice.client.businessNumber || 'N/A'}`);
        doc.text(`Date: ${invoice.date.toLocaleDateString()}`);

        doc.moveDown(2);

        // Line Items Table (Simplified)
        doc.text('Product Name', 50, 200);
        doc.text('Qty', 300, 200);
        doc.text('Price (€)', 350, 200);
        doc.text('Discount (%)', 420, 200);
        doc.text('Total (€)', 500, 200);
        doc.moveDown(0.5);
        doc.text('-------------------------------------------------------------------------------------------------------------------', 50, 210);

        let y = 230;
        invoice.items.forEach(item => {
            doc.text(item.productName, 50, y);
            doc.text(item.amount.toString(), 300, y);
            doc.text(item.price.toFixed(2), 350, y);
            doc.text(`${item.discountPercent}%`, 420, y);
            doc.text(item.totalLineItem.toFixed(2), 500, y);
            y += 20;
        });
        
        // Totals Summary
        doc.moveDown(2);
        doc.fontSize(10).text(`Subtotal (Excl. VAT): ${invoice.totalWithoutVAT.toFixed(2)} €`, 400, y + 20);
        doc.text(`Total VAT: ${invoice.totalVAT.toFixed(2)} €`, 400, y + 35);
        doc.fontSize(14).text(`GRAND TOTAL: ${invoice.total.toFixed(2)} €`, 400, y + 55);

        doc.end(); 
        
    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
});

// 4. PUT /api/invoices/:id: Update Invoice (e.g., status)
router.put('/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;
        
        // Ensure that only the status field (or other desired fields) can be updated.
        // Also, ensure the user owns the invoice.
        const updatedInvoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            { $set: { status: status, datePaid: status === 'Paid' ? new Date() : null } },
            { new: true, runValidators: true } // Return the updated document
        );

        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Invoice not found or unauthorized' });
        }

        // Send back a success message and the updated invoice (if needed)
        res.status(200).json({ message: 'Invoice updated successfully', invoice: updatedInvoice });
        
    } catch (error) {
        console.error('Invoice Update Error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Invoice ID format' });
        }
        res.status(500).json({ message: 'Failed to update invoice', error: error.message });
    }
});
// UPDATE INVOICE ITEMS
router.patch('/:id', protect, async (req, res) => {
    try {
        const {
            lineItems,
            totalWithoutVAT,
            totalVAT,
            total,
            note
        } = req.body;

        const itemsForSchema = lineItems.map(item => ({
            productID: item.productID,
            productName: item.productName,
            price: parseFloat(item.price),
            discountPercent: parseFloat(item.discountPercent || 0),
            amount: parseInt(item.amount),
            totalLineItem: parseFloat(item.totalLineItem),
        }));

        const updatedInvoice = await Invoice.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            {
                $set: {
                    items: itemsForSchema,
                    totalWithoutVAT: parseFloat(totalWithoutVAT),
                    totalVAT: parseFloat(totalVAT),
                    total: parseFloat(total),
                    notes: note || ""
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedInvoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.status(200).json({
            message: "Invoice items updated successfully",
            invoice: updatedInvoice
        });

    } catch (error) {
        console.error("Invoice UPDATE ERROR:", error);
        res.status(500).json({ message: "Failed to update invoice", error: error.message });
    }
});
// 🔥 DELETE INVOICE
router.delete('/:id', protect, async (req, res) => {
    try {
        const deletedInvoice = await Invoice.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id,   // ⛔ Prevent deleting others' invoices
        });

        if (!deletedInvoice) {
            return res.status(404).json({ message: "Invoice not found or unauthorized" });
        }

        res.status(200).json({ message: "Invoice deleted successfully" });

    } catch (error) {
        console.error("Invoice DELETE ERROR:", error);
        res.status(500).json({ message: "Failed to delete invoice", error: error.message });
    }
});

module.exports = router;