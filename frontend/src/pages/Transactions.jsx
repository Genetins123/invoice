// src/pages/Transactions.jsx
import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/transactions'; 
// Assuming you created a route for fetching transactions (we'll define it below)

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Transactions ---
    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            const result = await response.json();

            // Assuming the backend returns { success: true, data: [...] }
            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to fetch transactions.");
            }
            setTransactions(result.data);
        } catch (err) {
            setError(err.message);
            setTransactions([]);
        } finally {
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
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) return <div className="text-center py-8">Loading Transactions...</div>;
    if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

    return (
        <div className="p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
                {/* Placeholder Icon - You should use a real React icon library (e.g., react-icons) */}
                <span className="mr-3 text-green-600">💲</span>
                Financial Transactions
            </h2>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source / Payee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No transactions recorded.</td>
                            </tr>
                        ) : (
                            transactions.map((transaction) => (
                                <tr key={transaction._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(transaction.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {transaction.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.source}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {/* Display Account details (You might need to populate this on the backend) */}
                                        {transaction.accountId.name || transaction.accountId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                                        <span className={transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                                            {transaction.type === 'Income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.reference || 'N/A'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Transactions;