import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // ⭐ FIX: Updated the path to a standard location

const API_URL = 'http://localhost:5000/api/accounts';

const AddAccountForm = ({ onCancel, refreshList }) => {
    // ⭐ Use the hook to get the token directly from the context
    const { token } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // The token is now guaranteed to be the value from AuthContext state
        if (!token) {
            // If the token is null, the user is not authenticated
            alert('Authentication Error: Token not found. Please log in again.');
            setIsSubmitting(false);
            return;
        }
        
        const formData = {
            accountNo: e.target.accountNo.value,
            name: e.target.name.value,
            initialBalance: parseFloat(e.target.initialBalance.value), 
            note: e.target.note.value,
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // Pass the context-provided token in the Authorization header
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Account "${formData.name}" added successfully!`);
                onCancel(); 
                if (refreshList) { refreshList(); }
            } else {
                // If the backend returns a 401 Unauthorized, this catches it
                alert(`Failed to add account: ${data.error || 'Server error'}. Status: ${response.status}`);
            }

        } catch (error) {
            alert('A network error occurred. Please check the server connection.');
            console.error('API Post Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Add New Account</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account No Field */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <label htmlFor="accountNo" className="w-full md:w-1/4 text-gray-700 text-sm font-medium mb-1 md:mb-0">Account No</label>
                    <input type="text" id="accountNo" name="accountNo" placeholder="Account Number" className="flex-1 border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500 text-sm w-full" required />
                </div>
                {/* Name Field */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <label htmlFor="name" className="w-full md:w-1/4 text-gray-700 text-sm font-medium mb-1 md:mb-0">Name</label>
                    <input type="text" id="name" name="name" placeholder="Name" className="flex-1 border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500 text-sm w-full" required />
                </div>
                {/* Initial Balance Field */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <label htmlFor="initialBalance" className="w-full md:w-1/4 text-gray-700 text-sm font-medium mb-1 md:mb-0">Initial Balance</label>
                    <input type="number" id="initialBalance" name="initialBalance" placeholder="Initial Balance" className="flex-1 border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500 text-sm w-full" step="0.01" required />
                </div>
                {/* Note Field */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <label htmlFor="note" className="w-full md:w-1/4 text-gray-700 text-sm font-medium mb-1 md:mb-0">Note</label>
                    <textarea id="note" name="note" placeholder="Note" rows="3" className="flex-1 border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"></textarea>
                </div>
                {/* Action Buttons */}
                <div className="flex justify-start pt-4">
                    <button type="submit" disabled={isSubmitting} className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-6 rounded-md shadow-sm transition duration-150 mr-4 disabled:opacity-50">
                        {isSubmitting ? 'Adding...' : 'Add Account'}
                    </button>
                    <button type="button" onClick={onCancel} disabled={isSubmitting} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-md shadow-sm transition duration-150 disabled:opacity-50">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddAccountForm;