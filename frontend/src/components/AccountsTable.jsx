// frontend/src/components/AccountsTable.jsx (Updated for View/Edit)
import React from 'react';

const API_BASE_URL = 'http://localhost:5000/api/accounts';

// DELETE (D) Logic (remains the same)
const handleDelete = async (accountId, refreshData) => {
    if (!window.confirm("Are you sure you want to delete this account?")) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${accountId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('Account deleted successfully!');
            refreshData(); // Re-fetch accounts list
        } else {
            const data = await response.json();
            alert(`Error: ${data.error || 'Failed to delete account'}`);
        }
    } catch (error) {
        alert('A network error occurred.');
        console.error('Delete Network Error:', error);
    }
};

// AccountsTable now accepts onView and onEdit handlers as props
const AccountsTable = ({ accounts, refreshData, onView, onEdit }) => {
    if (!accounts || accounts.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mt-8 text-center">
                <p className="text-gray-600">No accounts found. Click 'Add New Account' to create one.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto mt-8">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {accounts.map((account, index) => (
                        <tr key={account._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.accountNo}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {/* View Button */}
                                <button 
                                    onClick={() => onView(account)} // Pass the entire account object
                                    className="text-blue-600 hover:text-blue-900 mr-2 p-2 rounded bg-blue-100"
                                >
                                    View
                                </button>
                                {/* Edit Button */}
                                <button 
                                    onClick={() => onEdit(account)} // Pass the entire account object
                                    className="text-yellow-600 hover:text-yellow-900 mr-2 p-2 rounded bg-yellow-100"
                                >
                                    Edit
                                </button> 
                                {/* Delete Button */}
                                <button 
                                    onClick={() => handleDelete(account._id, refreshData)}
                                    className="text-red-600 hover:text-red-900 p-2 rounded bg-red-100"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AccountsTable;