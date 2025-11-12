import React, { useState, useEffect } from 'react';
import { Eye, Printer, Trash2, X } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/transactions'; 

// --- Transaction Detail Modal Component ---
const TransactionDetailModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    // Mock data for Company and Client (as actual data structure is unknown)
    const companyInfo = {
        name: "ABC Company",
        address: "412 Example South Street",
        phone: "410-987-89-60",
        email: "support@ultimatekode.com"
    };

    // The transaction object from the table includes some nested fields like clientId/vendorId/clientName/vendorName
    // Using clientId?.name (populated from backend) or vendorName (from mock data)
    const clientName = transaction?.clientId?.name || transaction.vendorName || 'N/A';
    const clientAddress = transaction?.clientId?.address || '157 Cambridge Crossing, Lautaro'; // Mocked
    const clientPhone = transaction?.clientId?.phone || '215-454-8928'; // Mocked
    const clientEmail = transaction?.clientId?.email || 'pstamper25@cdbaby.com'; // Mocked

    const formatCurrency = (amount) => {
        return `$ ${parseFloat(amount).toFixed(2)}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB'); 
    };

    const isIncome = transaction.type === 'Income';
    const debitAmount = isIncome ? '0.00' : transaction.amount;
    const creditAmount = isIncome ? transaction.amount : '0.00';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-all transform duration-300">
                
                {/* Modal Header */}
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-2xl font-semibold text-gray-800">Transaction Details</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 p-1 transition duration-150"
                        title="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Print Button */}
                <div className='p-6 pb-0'>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition duration-150 border">
                        <Printer className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Modal Body - Transaction Content */}
                <div className="p-6 text-gray-700">
                    
                    {/* Section 1: Company & Client Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-6 mb-6">
                        {/* Column 1: Company Info */}
                        <div>
                            <p className="font-bold text-lg mb-1 text-gray-900">{companyInfo.name}</p>
                            <p className="text-sm">{companyInfo.address}</p>
                            <p className="text-sm mt-3">Phone: {companyInfo.phone}</p>
                            <p className="text-sm">Email: {companyInfo.email}</p>
                        </div>

                        {/* Column 2: Client/Vendor Info */}
                        <div className="md:text-right">
                            <p className="font-bold text-lg mb-1 text-gray-900">{clientName}</p>
                            <p className="text-sm">{clientAddress}</p>
                            <p className="text-sm mt-3">Phone: {clientPhone}</p>
                            <p className="text-sm">Email: {clientEmail}</p>
                        </div>
                    </div>

                    {/* Section 2: Financial Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Amounts & Type */}
                        <div className="space-y-3">
                            <p className="border-b pb-1">
                                <span className="font-semibold w-20 inline-block">Debit</span>: 
                                <span className="text-red-600 ml-2">{formatCurrency(debitAmount)}</span>
                            </p>
                            <p className="border-b pb-1">
                                <span className="font-semibold w-20 inline-block">Credit</span>: 
                                <span className="text-green-600 ml-2">{formatCurrency(creditAmount)}</span>
                            </p>
                            <p className="border-b pb-1">
                                <span className="font-semibold w-20 inline-block">Type</span>: 
                                <span className="ml-2">{transaction.type}</span>
                            </p>
                            <p className="mt-4">
                                <span className="font-semibold block">Note</span>: 
                                <span className="ml-0 text-sm italic">{transaction.note || 'No note provided for this transaction.'}</span>
                            </p>
                        </div>

                        {/* Column 2: Metadata */}
                        <div className="space-y-3">
                            <p className="border-b pb-1">
                                <span className="font-semibold w-20 inline-block">Date</span>: 
                                <span className="ml-2">{formatDate(transaction.date)}</span>
                            </p>
                            <p className="border-b pb-1">
                                <span className="font-semibold w-20 inline-block">ID</span>: 
                                <span className="ml-2 font-mono text-xs text-gray-500">{transaction._id || 'N/A'}</span>
                            </p>
                            <p className="border-b pb-1">
                                <span className="font-semibold w-20 inline-block">Category</span>: 
                                <span className="ml-2">{transaction.category || 'Sales'}</span>
                            </p>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Transactions Component ---
const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for the modal
    const [showModal, setShowModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);


    // --- Fetch Transactions (Mock Data for demonstration purposes if API fails) ---
    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        let fetchedData = [];
        try {
            const response = await fetch(API_URL);
            const result = await response.json();

            if (!response.ok || !result.success) {
                 // Fallback to mock data if API call fails
                throw new Error(result.error || "Failed to fetch transactions. Loading mock data instead.");
            }
            fetchedData = result.data;
        } catch (err) {
            console.error(err.message);
            setError(err.message);
            
            // Mock Data for consistent display if backend is unavailable
            fetchedData = [
                { _id: '61a2c3f4e5d6c7b8a901d2e3', date: '2025-11-04', type: 'Expense', amount: 55.00, accountId: { name: 'Company Sales Account' }, clientName: 'Stephen L. Turner', paymentMethod: 'Card', category: 'Software', note: 'Monthly subscription fee.' },
                { _id: '61a2c3f4e5d6c7b8a901d2e4', date: '2025-11-04', type: 'Income', amount: 100.00, accountId: { name: 'Company Sales Account' }, vendorName: 'Gertrud Whickman', paymentMethod: 'Cash', category: 'Sales', note: 'Payment for invoice #1075' },
                { _id: '61a2c3f4e5d6c7b8a901d2e5', date: '2025-11-05', type: 'Income', amount: 91.27, accountId: { name: 'Company Sales Account' }, vendorName: 'Prince Stamper', paymentMethod: 'Transfer', category: 'Sales', note: 'Payment for invoice #1075' },
                { _id: '61a2c3f4e5d6c7b8a901d2e6', date: '2025-11-05', type: 'Expense', amount: 12.50, accountId: { name: 'Company Sales Account' }, clientName: 'Local Market', paymentMethod: 'Cash', category: 'Supplies', note: 'Office snacks.' },
            ];
        } finally {
            setTransactions(fetchedData);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const formatCurrency = (amount) => {
        return `$ ${parseFloat(amount).toFixed(2)}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB'); 
    };

    // --- Action Handlers ---
    const handleView = (transaction) => {
        setSelectedTransaction(transaction);
        setShowModal(true);
    };

    const handlePrint = (transaction) => {
        console.log(`Action: Printing Transaction ID: ${transaction._id}`, transaction);
    };

    const handleDelete = async (transactionId) => {
        if (!window.confirm("Are you sure you want to delete this transaction? This action will reverse the balance change on the associated account.")) {
            return; // User cancelled the operation
        }

        try {
            setLoading(true); // Indicate processing
            
            const response = await fetch(`${API_URL}/${transactionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete transaction ${transactionId}`);
            }

            // Successfully deleted: Update the frontend state to remove the transaction
            setTransactions(prevTransactions => 
                prevTransactions.filter(t => t._id !== transactionId)
            );
            
            console.log(`Successfully deleted transaction ID: ${transactionId}`);
            
            // Re-fetch data to ensure balances and remaining list is correct
            await fetchTransactions(); 

        } catch (err) {
            console.error('Deletion error:', err.message);
            setError(`Failed to delete transaction: ${err.message}`);
        } finally {
            setLoading(false); // End loading state
        }
    };
    
    // --- Render Logic ---
    if (loading) return <div className="text-center py-8">
        <svg className="animate-spin h-6 w-6 text-purple-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-gray-700">Loading Transactions...</p>
    </div>;

    return (
        <div className="p-6 bg-white shadow-xl rounded-xl max-w-7xl mx-auto my-8 font-sans">
            <h2 className="text-3xl font-extrabold mb-6 text-gray-800 border-b pb-2">
                Transaction History
            </h2>

            {error && (
                 <div className="text-red-600 bg-red-100 border border-red-400 p-4 rounded-lg text-center mx-auto max-w-lg mb-6">Error: {error}</div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700">Showing {transactions.length} entries</div>
                <input type="text" placeholder="Search..." className="p-2 border border-gray-300 rounded-lg shadow-sm w-full sm:w-64 focus:ring-purple-500 focus:border-purple-500 transition duration-150" />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source / Account</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Debit (Expense)</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Credit (Income)</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payer</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-lg text-gray-500">
                                    No transactions recorded yet.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((transaction) => {
                                const isIncome = transaction.type === 'Income';
                                const debitAmount = isIncome ? '0.00' : transaction.amount;
                                const creditAmount = isIncome ? transaction.amount : '0.00';
                                
                                return (
                                    <tr key={transaction._id} className="hover:bg-purple-50 transition duration-100">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="font-semibold">{transaction.source || (isIncome ? 'Sale' : 'Purchase')}</span>
                                            <span className="block text-xs text-gray-400">
                                                {transaction.accountId?.name || transaction.accountId}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-red-600">
                                            {formatCurrency(debitAmount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-green-600">
                                            {formatCurrency(creditAmount)}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {transaction?.clientId?.name || transaction.vendorName || 'N/A'}
                                        </td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                `}>
                                                {transaction.paymentMethod || transaction.type}
                                            </span>
                                        </td>                                                                         
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1.5">
                                            <button 
                                                onClick={() => handleView(transaction)}
                                                title="View Details"
                                                className="p-2 text-purple-600 hover:text-purple-800 rounded-full transition duration-150 hover:bg-purple-100"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handlePrint(transaction)}
                                                title="Print"
                                                className="p-2 text-blue-600 hover:text-blue-800 rounded-full transition duration-150 hover:bg-blue-100"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(transaction._id)}
                                                title="Delete Transaction"
                                                className="p-2 text-red-600 hover:text-red-800 rounded-full transition duration-150 hover:bg-red-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

             {/* Pagination Placeholder */}
             <div className="flex justify-between items-center mt-6 text-sm text-gray-700">
                <div>Showing 1 to {transactions.length} of {transactions.length} results</div>
                <div className="flex space-x-2">
                    <button className="py-1 px-3 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50" disabled>Previous</button>
                    <button className="py-1 px-3 border border-gray-300 rounded-lg bg-purple-600 text-white">1</button>
                    <button className="py-1 px-3 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50" disabled>Next</button>
                </div>
            </div>

            {/* Transaction Detail Modal */}
            <TransactionDetailModal 
                transaction={selectedTransaction} 
                onClose={() => {
                    setShowModal(false);
                    setSelectedTransaction(null);
                }}
            />
        </div>
    );
};

export default Transactions;