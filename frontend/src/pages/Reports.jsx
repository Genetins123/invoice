// src/pages/Reports.jsx (Updated for Payment Modal & Auth Check)
import React, { useState, useEffect, useMemo } from 'react';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../context/AuthContext'; // NEW IMPORT for Auth

const API_INVOICES_URL = 'http://localhost:5000/api/invoices';
const API_ACCOUNTS_URL = 'http://localhost:5000/api/accounts'; // Used for the dropdown

const Reports = () => {
    const { token } = useAuth(); // Access the token for API calls
    
    const [allInvoices, setAllInvoices] = useState([]);
    const [allAccounts, setAllAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // State for modal control
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [invoiceToPay, setInvoiceToPay] = useState(null);

    // --- Fetch Invoices and Accounts ---
    const fetchData = async () => {
        if (!token) {
            setError("Authentication required to fetch reports data. Please log in.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // ADDED AUTHORIZATION HEADER
        };

        try {
            // 1. Fetch Invoices
            const invoiceResponse = await fetch(API_INVOICES_URL, { headers });
            const invoiceResult = await invoiceResponse.json();
            if (!invoiceResponse.ok || !Array.isArray(invoiceResult)) {
                if (invoiceResponse.status === 401 || invoiceResponse.status === 403) {
                    throw new Error("Session expired or unauthorized. Please log in again.");
                }
                throw new Error("Failed to fetch invoices list.");
            }
            setAllInvoices(invoiceResult); 

            // 2. Fetch Accounts
            const accountResponse = await fetch(API_ACCOUNTS_URL, { headers });
            const accountResult = await accountResponse.json();
            // Assuming the Account API returns { success: true, data: [...] }
            if (!accountResponse.ok || !accountResult.success) {
                if (accountResponse.status === 401 || accountResponse.status === 403) {
                    throw new Error("Session expired or unauthorized. Please log in again.");
                }
                throw new Error("Failed to fetch account list.");
            }
            setAllAccounts(accountResult.data); 

        } catch (err) {
            setError(`Data loading failed: ${err.message}.`);
            console.error("Fetching error:", err);
            setAllInvoices([]);
            setAllAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]); // Re-run fetch when token changes (login/logout)
    
    // --- Handlers for Payment Modal (unchanged) ---
    const handlePayClick = (invoice) => {
        setInvoiceToPay(invoice);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setInvoiceToPay(null);
        fetchData(); // Re-fetch all data to show updated invoice status and account balance
    };

    const handleCloseModal = () => {
        setShowPaymentModal(false);
        setInvoiceToPay(null);
    };

    // --- Filtering Logic (useMemo remains the same) ---
    const filteredInvoices = useMemo(() => {
        if (!allInvoices || allInvoices.length === 0) return [];
        
        let filtered = allInvoices;
        
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start || end) {
            filtered = allInvoices.filter(invoice => {
                const invoiceDate = new Date(invoice.date || invoice.createdAt); 
                
                if (start) start.setHours(0, 0, 0, 0); 
                if (end) end.setHours(23, 59, 59, 999); 

                const isAfterStart = !start || invoiceDate >= start;
                const isBeforeEnd = !end || invoiceDate <= end;
                
                return isAfterStart && isBeforeEnd;
            });
        }
        return filtered;
    }, [allInvoices, startDate, endDate]);

    const handleFilter = () => {
        // Simple alert to confirm filter logic is triggered
        alert(`Filtered to ${filteredInvoices.length} records.`);
    };
    
    // --- Conditional Rendering for Loading and Error ---

    if (loading) {
        return <div className="p-8 text-center text-blue-600">Loading data...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600 font-medium">Error: {error}</div>;
    }

    return (
        <div className="p-8 bg-gray-50 flex-1">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Reports by date</h2>

            {/* Date Filter Bar (unchanged) */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center space-x-4 max-w-xl">
                {/* ... (input fields and filter button) ... */}
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <button
                    onClick={handleFilter}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors"
                >
                    Filter
                </button>
            </div>

            {/* Filtered Invoice List */}
            <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* ... (Table head unchanged) ... */}
                    <thead className="bg-gray-50">
                        <tr>
                            {['Invoice Number', 'Date', 'Client Name', 'Paid Status'].map((header) => (
                                <th 
                                    key={header} 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInvoices.length === 0 ? (
                             <tr>
                                 <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                     {allInvoices.length === 0 ? "No invoices found in the system." : "No invoices match the date filter criteria."}
                                 </td>
                            </tr>
                        ) : (
                            filteredInvoices.map((invoice) => (
                                <tr key={invoice._id || invoice.invoiceNumber}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {invoice.invoiceNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(invoice.date || invoice.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {invoice.client?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'Due' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {invoice.status === 'Due' ? 'Not Paid' : invoice.status}
                                        </span>
                                    </td>
                                    {/* Action Buttons */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {/* ... (Print, Edit, Details buttons remain the same) ... */}
                                        
                                        <button 
                                            onClick={() => handlePayClick(invoice)} // Use the new handler
                                            disabled={invoice.status !== 'Due'} // Disable if already paid
                                            className={`text-green-600 hover:text-green-900 py-1 px-3 rounded-md ${invoice.status === 'Due' ? 'bg-green-100' : 'bg-gray-100 opacity-50 cursor-not-allowed'}`}
                                        >
                                            💲 Pay
                                        </button>
                                        {/* <button className="text-gray-600 hover:text-gray-900 bg-gray-100 py-1 px-3 rounded-md">
                                            📄 Details
                                        </button> */}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Confirmation Modal */}
            {showPaymentModal && invoiceToPay && (
                <PaymentModal 
                    invoice={invoiceToPay}
                    accounts={allAccounts}
                    onClose={handleCloseModal}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
};

export default Reports;