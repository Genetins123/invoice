// src/pages/InvoiceList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import AddInvoice from '../components/AddInvoice'; 
import InvoiceDetails from '../components/InvoiceDetails';
// Importing icons for a cleaner UI
import { Loader2, AlertTriangle, Printer, Eye, Download, Trash2, Send } from 'lucide-react'; 

const API_URL = 'http://localhost:5000/api';

const InvoiceList = ({ setIsDetailsView = () => {} }) => { 
    // --- 1. STATE DECLARATIONS ---
    const [view, setView] = useState('list'); 
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null); 
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 2. FETCH FUNCTION ---
    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/invoices`);

            if (!response.ok) {
                // If the response is not 2xx, try to read the error message
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setInvoices(data);

        } catch (err) {
            console.error('Error fetching invoices:', err);
            setError('Failed to load invoices. Check if the backend is running and the route is correct.');
        } finally {
            setLoading(false);
        }
    }, []); 

    // Function to update the view state (and inform the parent)
    const updateView = (newView, id = null) => {
        setView(newView);
        setSelectedInvoiceId(id);
        setIsDetailsView(newView === 'details'); 
    };
    
    // Function to return to the list view
    const goBackToList = () => {
        updateView('list');
        fetchInvoices(); // Refresh list after adding/editing/deleting
    };

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices, view]); 
    
    // Triggers the backend PDF download
    const handlePrintPDF = (invoiceId) => {
        window.open(`${API_URL}/invoices/${invoiceId}/pdf`, `_blank`);
    };

    // ⭐ NEW ACTION: Handle Invoice Deletion
    const handleDeleteInvoice = async (invoiceId) => {
        if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
            return;
        }

        try {
            // NOTE: You must implement the DELETE /api/invoices/:id route on your backend.
            const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete invoice.");
            }

            // Success feedback and refresh the list
            alert(`Invoice #${invoiceId} successfully deleted.`);
            fetchInvoices(); 

        } catch (err) {
            setError(`Deletion Error: ${err.message}`);
            alert(`Deletion failed. See console for details.`);
        }
    };
    
    // ⭐ NEW ACTION: Handle Status Change (e.g., Mark as Sent/Draft/Due)
    const handleUpdateStatus = async (invoiceId, newStatus) => {
        try {
            // NOTE: You must implement a PUT/PATCH /api/invoices/:id route to handle status updates.
            const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update status to ${newStatus}.`);
            }

            alert(`Invoice status updated to: ${newStatus}`);
            fetchInvoices(); // Refresh the list to show new status

        } catch (err) {
            setError(`Status Update Error: ${err.message}`);
            alert(`Status update failed. See console for details.`);
        }
    };

    // --- RENDER LOGIC: Switch between views ---
    
    if (view === 'add') {
        return <AddInvoice goBack={goBackToList} />;
    }
    
    if (view === 'details' && selectedInvoiceId) {
        return <InvoiceDetails 
            invoiceId={selectedInvoiceId} 
            goBack={goBackToList}
            // Pass the refetch function down so details can refresh parent list upon payment/edit
            onUpdate={fetchInvoices} 
        />;
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
                    onClick={() => updateView('add')} 
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
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Actions' ? 'text-center' : ''}`}
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
                                        invoice.status === 'Due' ? 'bg-yellow-100 text-yellow-800' : 
                                        invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium flex justify-center items-center space-x-2">
                                    
                                    {/* Action Button: Update Status (Example: Mark as Sent) */}
                                    {invoice.status === 'Draft' && (
                                        <button 
                                            onClick={() => handleUpdateStatus(invoice._id, 'Sent')}
                                            title="Mark as Sent" 
                                            className="text-gray-500 hover:text-blue-500 p-1 transition-colors"
                                        >
                                            <Send size={18} />
                                        </button>
                                    )}

                                    {/* Action Button: View Details */}
                                    <button 
                                        onClick={() => updateView('details', invoice._id)}
                                        title="View Details" 
                                        className="text-blue-600 hover:text-blue-900 p-1 transition-colors"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    
                                    {/* Action Button: Download PDF */}
                                    <button 
                                        onClick={() => handlePrintPDF(invoice._id)}
                                        title="Download PDF" 
                                        className="text-indigo-600 hover:text-indigo-900 p-1 transition-colors"
                                    >
                                        <Download size={18} />
                                    </button>

                                    {/* Action Button: Delete */}
                                    <button 
                                        onClick={() => handleDeleteInvoice(invoice._id)}
                                        title="Delete Invoice" 
                                        className="text-red-600 hover:text-red-900 p-1 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            </div>
            {/* Pagination/Summary placeholder here if needed */}
        </div>
    );
};

export default InvoiceList;