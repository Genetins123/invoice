// src/pages/InvoiceList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Eye, Download, X, Plus, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// ⭐ 1. IMPORT InvoiceDetails
import InvoiceDetails from '../components/InvoiceDetails';
// ⭐ add this import near InvoiceDetails import
import InvoiceEdit from '../components/InvoiceEdit';


const API_URL = 'http://localhost:5000/api';

// --- 1. INITIAL STATE FOR ADD INVOICE FORM (Moved here) ---
const initialItem = {
    // productID: '', // No need to initialize here, will be added on select
    barcode: '',
    product: '',
    price: 0,
    amount: 1, // Quantity
    discount: 0, // Percentage
    total: 0,
};

// Accept setIsDetailsView and provide a default empty function for safety
const InvoiceList = ({ setIsDetailsView = () => { } }) => {
    // ⭐ 2. GET AUTHENTICATION TOKEN
    const { token } = useAuth();

    // --- STATE DECLARATIONS ---
    const [view, setView] = useState('list');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true); // For list loading
    const [error, setError] = useState(null);

    // --- ADD INVOICE STATES ---
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingInitialData, setLoadingInitialData] = useState(false); // For add form initial data
    const [formError, setFormError] = useState(null);
    const [newItem, setNewItem] = useState(initialItem);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // --- CALCULATED VALUES for Add Invoice ---
    const vatRate = 0.23; // Assuming 23% VAT rate
    const subtotal = invoiceItems.reduce((acc, item) => acc + item.total, 0);
    const vatAmount = subtotal * vatRate;
    const totalWithVAT = subtotal + vatAmount;

    // --- VIEW AND DATA FETCHING FUNCTIONS ---

    // Function to fetch the list of invoices
    const fetchInvoices = useCallback(async () => {
        // ⭐ SECURITY GUARD
        if (!token) {
            setError("Authentication required. Please log in.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/invoices`, {
                headers: {
                    'Authorization': `Bearer ${token}` // ⭐ ADD TOKEN
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setInvoices(data);
        } catch (err) {
            console.error('Error fetching invoices:', err);
            setError('Failed to load invoices. Check server or login status.');
        } finally {
            setLoading(false);
        }
    }, [token]); // ⭐ ADD TOKEN DEPENDENCY


    // ⭐ CORRECTED ORDERING: Define fetchAddFormInitialData here (before its useEffect call)
    const fetchAddFormInitialData = useCallback(async () => {
        // ⭐ SECURITY GUARD
        if (!token) {
            setFormError("Authentication required to fetch client/product data.");
            setLoadingInitialData(false);
            return;
        }

        setLoadingInitialData(true);
        setFormError(null);
        try {
            const authHeader = { 'Authorization': `Bearer ${token}` }; // ⭐ AUTH HEADER

            const [clientsRes, productsRes] = await Promise.all([
                fetch(`${API_URL}/clients`, { headers: authHeader }), // ⭐ ADD TOKEN
                fetch(`${API_URL}/products`, { headers: authHeader }), // ⭐ ADD TOKEN
            ]);

            if (!clientsRes.ok || !productsRes.ok) {
                throw new Error('Failed to fetch clients or products.');
            }

            const clientsData = await clientsRes.json();
            const productsData = await productsRes.json();

            setClients(clientsData);
            setProducts(productsData);
            // Auto-select the first client if available
            if (clientsData.length > 0) {
                setSelectedClient(clientsData[0]);
            }
        } catch (error) {
            setFormError('Could not load clients or products. Check API connection/token.');
        } finally {
            setLoadingInitialData(false);
        }
    }, [token]); // ⭐ ADD TOKEN DEPENDENCY

    // Function to update the view state (and inform the parent)
    const updateView = (newView, id = null) => {
        setView(newView);
        setSelectedInvoiceId(id);
        // This ensures the parent component knows the layout should change to full screen
        setIsDetailsView(newView === 'details');

        // Reset Add Invoice form state when leaving it
        if (newView !== 'add') {
            setInvoiceItems([]);
            setSelectedClient(null);
            setNote('');
            setFormError(null);
            setNewItem(initialItem);
            setSelectedProduct(null);
        }
    };

    // Function to return to the list view
    const goBackToList = () => {
        updateView('list');
    };

    // useEffect to fetch invoice list when component mounts or returns to 'list' view
    useEffect(() => {
        if (view === 'list') {
            fetchInvoices();
        }
    }, [fetchInvoices, view]);

    // ⭐ NEW useEffect: Fetch client/product data only when entering 'add' view
    useEffect(() => {
        if (view === 'add') {
            fetchAddFormInitialData();
        }
    }, [view, fetchAddFormInitialData]);


    // Triggers the backend PDF download
    const handlePrintPDF = (invoiceId) => {
        // NOTE: The token is not sent directly to window.open, but relies on the backend protection.
        // If the backend requires a token, you must use a cookie or a temporary signed URL.
        window.open(`${API_URL}/invoices/${invoiceId}/pdf`, `_blank`);
    };

    // --- ADD INVOICE FORM LOGIC ---

    // Handles selecting a product from the dropdown
    const handleProductSelect = (e) => {
        const selectedBarcode = e.target.value;
        const product = products.find(p => p.barcode === selectedBarcode);

        if (product) {
            setSelectedProduct(product);
            // Ensure calculation uses the current amount/discount even if the product changes
            const currentAmount = newItem.amount;
            const currentDiscount = newItem.discount;
            const discountedPrice = product.price * (1 - currentDiscount / 100);

            setNewItem({
                ...newItem,
                barcode: product.barcode,
                product: product.name,
                price: product.price,
                total: discountedPrice * currentAmount,
            });
        } else {
            setSelectedProduct(null);
            setNewItem(initialItem);
        }
    };

    // Handles changes in price, amount, or discount for the item being added
    const handleNewItemChange = (e) => {
        const { name, value } = e.target;
        let updatedItem = { ...newItem, [name]: parseFloat(value) || 0 };

        if (name === 'product' || name === 'barcode') return;

        const price = updatedItem.price;
        const amount = updatedItem.amount;
        const discount = updatedItem.discount; // as a percentage

        const discountedPrice = price * (1 - discount / 100);
        updatedItem.total = discountedPrice * amount;

        setNewItem(updatedItem);
    };

    // Adds the current item to the invoice list
    const handleAddItem = () => {
        if (!selectedProduct) {
            setFormError('Please select a product before adding.');
            return;
        }
        if (newItem.amount <= 0 || newItem.price <= 0) {
            setFormError('Price and Amount must be greater than zero.');
            return;
        }
        setFormError(null);

        const itemToAdd = {
            // ⭐ ADDED: productID is required by the Mongoose schema
            productID: selectedProduct._id,
            barcode: newItem.barcode,
            product: newItem.product,
            price: newItem.price,
            amount: newItem.amount,
            discount: newItem.discount,
            total: newItem.total,
        };

        setInvoiceItems([...invoiceItems, itemToAdd]);
        // Reset the input fields after adding
        setSelectedProduct(null);
        setNewItem(initialItem);
    };

    // Removes an item from the invoice list
    const handleDeleteItem = (index) => {
        setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    };

    // Submission handler
    const handleAddInvoiceSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        // ⭐ SECURITY GUARD
        if (!token) {
            setFormError('Authentication required to save invoice.');
            return;
        }

        if (!selectedClient) {
            setFormError('Please select a client.');
            return;
        }
        if (invoiceItems.length === 0) {
            setFormError('The invoice must contain at least one product.');
            return;
        }

        setIsSubmitting(true);

        // ⭐ CORRECTED PAYLOAD KEYS to match backend's invoiceRoutes.js
        const invoicePayload = {
            // Corrected from 'client' to 'clientId'
            clientId: selectedClient._id,

            // Corrected from 'items' to 'lineItems'
            lineItems: invoiceItems.map(item => ({
                productID: item.productID, // Now included from handleAddItem
                productName: item.product,
                price: item.price, // Corrected from 'unitPrice'
                amount: item.amount, // Corrected from 'quantity'
                discountPercent: item.discount, // Corrected from 'discount'
                totalLineItem: item.total, // Corrected from 'lineTotal'
            })),

            // Corrected from 'subtotal' to 'totalWithoutVAT'
            totalWithoutVAT: subtotal.toFixed(2),

            // Corrected from 'vat' to 'totalVAT'
            totalVAT: vatAmount.toFixed(2),

            total: totalWithVAT.toFixed(2),
            status: 'Due',
            note: note, // Matches the destructuring in the Express route
            // date is handled by schema default, no need to send
        };

        try {
            const response = await fetch(`${API_URL}/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // ⭐ ADD TOKEN
                },
                body: JSON.stringify(invoicePayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Mongoose validation errors will be caught here
                throw new Error(errorData.message || 'Failed to create invoice.');
            }

            // Successful creation
            alert('✅ Invoice created successfully!');
            updateView('list'); // Go back to the list
        } catch (error) {
            console.error('Invoice creation error:', error);
            setFormError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER LOGIC: Switch between views ---

    // ⭐ GLOBAL AUTH GUARD
    if (!token) {
        return (
            <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 font-semibold rounded-lg flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <AlertTriangle size={32} />
                <h3 className="text-xl font-bold">Access Restricted: Not Authenticated</h3>
                <p>Please log in to view and manage invoices.</p>
            </div>
        );
    }

    // --- RENDER ADD INVOICE VIEW ---
    if (view === 'add') {
        if (loadingInitialData) {
            return (
                <div className="p-8 text-center text-indigo-600 flex flex-col items-center justify-center h-full min-h-[400px]">
                    <Loader2 className="animate-spin mb-3" size={32} />
                    Loading clients and products...
                </div>
            );
        }

        return (
            <div className="p-8 bg-gray-50 flex-1 min-h-screen">
                <header className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-3xl font-bold text-gray-900">Add New Invoice</h2>
                    <button
                        onClick={goBackToList}
                        className="text-gray-500 hover:text-gray-800 transition-colors p-2 rounded-full"
                        title="Go back to list"
                    >
                        <X size={24} />
                    </button>
                </header>

                <form onSubmit={handleAddInvoiceSubmit} className="flex flex-col lg:flex-row gap-8">

                    {/* --- LEFT SIDE: Invoice Items --- */}
                    <div className="flex-1 space-y-6">

                        {/* 1. Add Product Form */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Select Product</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">

                                {/* Product Select */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                                    <select
                                        value={selectedProduct ? selectedProduct.barcode : ''}
                                        onChange={handleProductSelect}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select a product...</option>
                                        {products.map((product) => (
                                            <option key={product._id} value={product.barcode}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Price (€) - Read Only */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (€)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={newItem.price.toFixed(2)}
                                        readOnly
                                        className="w-full border border-gray-300 bg-gray-100 rounded-lg p-2.5 text-gray-600"
                                    />
                                </div>

                                {/* Amount (Quantity) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        min="1"
                                        step="1"
                                        value={newItem.amount}
                                        onChange={handleNewItemChange}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                {/* Discount (%) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                                    <input
                                        type="number"
                                        name="discount"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={newItem.discount}
                                        onChange={handleNewItemChange}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                {/* Add Button */}
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={!selectedProduct || isSubmitting}
                                    className="col-span-5 md:col-span-1 bg-green-600 hover:bg-green-700 text-white font-bold p-2.5 rounded-lg shadow-md transition-colors disabled:bg-gray-400 flex items-center justify-center"
                                >
                                    <Plus size={20} />
                                    <span className="ml-1 hidden md:inline">Add</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Invoice Items Table */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
                            {invoiceItems.length === 0 ? (
                                <div className="text-center py-6 text-gray-500">
                                    No products added yet.
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {['Barcode', 'Product', 'Price (€)', 'Discount (%)', 'Amount', 'Total (€)', 'Actions'].map((header) => (
                                                <th
                                                    key={header}
                                                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Actions' ? 'text-right' : ''}`}
                                                >
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoiceItems.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.barcode}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{item.product}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.price.toFixed(2)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.discount}%</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.amount}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-extrabold text-gray-900">{item.total.toFixed(2)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteItem(index)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Delete Item"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* --- RIGHT SIDE: Client Info & Totals --- */}
                    <div className="w-full lg:w-96 bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">

                        {/* 1. Client Selection */}
                        <div className="pb-4 border-b">
                            <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                            <select
                                id="client-select"
                                value={selectedClient?._id || ''}
                                onChange={(e) => setSelectedClient(clients.find(c => c._id === e.target.value))}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select a client...</option>
                                {clients.map((client) => (
                                    <option key={client._id} value={client._id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>

                            {selectedClient && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                                    <p className="text-sm text-gray-600">Contact: {selectedClient.contactName}</p>
                                    <p className="text-sm text-gray-600">Phone: {selectedClient.phone}</p>
                                </div>
                            )}
                        </div>

                        {/* 2. Notes */}
                        <div>
                            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note:</label>
                            <textarea
                                id="note"
                                rows="3"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Add any specific notes for this invoice..."
                            />
                        </div>

                        {/* 3. Totals Summary */}
                        <div className="pt-4 border-t space-y-2">
                            <div className="flex justify-between font-medium text-gray-700">
                                <span>Total Without VAT ({`${(vatRate * 100).toFixed(0)}%`})</span>
                                <span>{subtotal.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between font-medium text-gray-700">
                                <span>VAT Amount</span>
                                <span>{vatAmount.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between font-extrabold text-xl text-gray-900 border-t pt-2 mt-2">
                                <span>Total</span>
                                <span>{totalWithVAT.toFixed(2)}€</span>
                            </div>
                        </div>

                        {/* 4. Error & Submit */}
                        {formError && (
                            <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
                                {formError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || invoiceItems.length === 0}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:bg-gray-400 flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="animate-spin mr-2" size={20} /> Saving...</>
                            ) : (
                                'Save Invoice'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ⭐ NEW: RENDER INVOICE DETAILS VIEW
    if (view === 'details') {
        if (!selectedInvoiceId) {
            // Safety measure, should not happen if the list button logic is correct
            goBackToList();
            return null;
        }

        return (
            <InvoiceDetails
                invoiceId={selectedInvoiceId}
                goBack={goBackToList}
                API_URL={API_URL}
                token={token} // Pass token for API calls
            />
        );
    }
    // --- RENDER INVOICE LIST VIEW (Default) ---
    // ⭐ NEW: render edit view
    if (view === 'edit') {
        if (!selectedInvoiceId) {
            goBackToList();
            return null;
        }

        return (
            <InvoiceEdit
                invoiceId={selectedInvoiceId}
                goBack={goBackToList}
            />
        );
    }


    if (loading) {
        return (
            <div className="p-8 text-center text-indigo-600 flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin mb-3" size={32} />
                Loading invoices...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 font-semibold rounded-lg flex items-center justify-center space-x-2">
                <AlertTriangle size={20} />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 flex-1 min-h-screen">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-900">Invoice List</h2>

                <button
                    onClick={() => updateView('add')} // Navigate to Add view
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center"
                >
                    <span className="mr-2">+</span>
                    Add New Invoice
                </button>
            </div>

            <p className="text-gray-500 mb-6 font-medium">
                {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'} Found
            </p>

            <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
                {invoices.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No invoices found. Click "Add New Invoice" to get started.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Invoice #', 'Date', 'Client Name', 'Total (€)', 'Status', 'Actions'].map((header) => (
                                    <th
                                        key={header}
                                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Actions' ? 'text-right' : ''}`}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-600">#{invoice.invoiceNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{invoice.client?.name || 'Unknown Client'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900">{parseFloat(invoice.total).toFixed(2)}€</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                invoice.status === 'Due' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {invoice.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                       
                                        {/* To show the InvoiceDetails screen on click of the view icon */}
                                        <button
                                            onClick={() => updateView('details', invoice._id)}
                                            title="View Details"
                                            className="text-blue-600 hover:text-blue-900 p-1 transition-colors"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => updateView('edit', invoice._id)}
                                            title="Edit Invoice"
                                            className="text-yellow-600 hover:text-yellow-900 p-1 transition-colors"
                                        >
                                            {/* Use an icon you prefer; using Plus as simple placeholder — replace if you want */}
                                            {/* <span className="font-medium">Edit</span> */}
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default InvoiceList;