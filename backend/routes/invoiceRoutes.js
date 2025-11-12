const express = require('express');
const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit'); 
const router = express.Router();

// Helper to get the next Invoice Number
const getNextInvoiceNumber = async () => {
    const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
    return lastInvoice ? lastInvoice.invoiceNumber + 1 : 1001; 
};


router.delete('/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;

        // NOTE ON SECURITY: In a real application, you might want to prevent 
        // deletion if the invoice status is 'Paid' to avoid accounting issues.
        
        const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId);

        if (!deletedInvoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Successfully deleted the invoice
        res.status(200).json({ 
            message: 'Invoice deleted successfully', 
            invoice: deletedInvoice 
        });

    } catch (error) {
        console.error('Invoice Deletion Error:', error);
        res.status(500).json({ message: 'Error deleting invoice', error: error.message });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const invoiceId = req.params.id;
        // The frontend sends { status: 'Paid' } in the body
        const updates = req.body; 

        // Find the document and update it
        const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, updates, {
            new: true, // Return the updated document
            runValidators: true // Ensure validations run
        });

        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json({ message: 'Invoice updated successfully', invoice: updatedInvoice });

    } catch (error) {
        console.error('Invoice Update Error:', error);
        res.status(500).json({ message: 'Error updating invoice status', error: error.message });
    }
});

// 1. POST /api/invoices: Create New Invoice
router.post('/', async (req, res) => {
    try {
        const invoiceNumber = await getNextInvoiceNumber();
        
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
router.get('/', async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .select('invoiceNumber date client total status')
            .populate('client', 'name')
            .sort({ date: -1 });

        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices' });
    }
});

// 3. GET /api/invoices/:id: Get Single Invoice Detail (FIXES 404 ERROR)
router.get('/:id', async (req, res) => {
    try {
        // Find the invoice by ID and populate the client field
        const invoice = await Invoice.findById(req.params.id)
            .populate('client')
            .exec();

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching single invoice:', error);
        res.status(500).json({ message: 'Error fetching invoice details', error: error.message });
    }
});

// 4. GET /api/invoices/:id/pdf: Generate Invoice PDF
router.get('/:id/pdf', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('client');
        
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);
        doc.pipe(res);

        // --- Basic PDF Layout (as provided previously) ---
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

module.exports = router;