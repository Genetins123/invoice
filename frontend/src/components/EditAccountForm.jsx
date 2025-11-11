// frontend/src/components/EditAccountForm.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/accounts';

const EditAccountForm = ({ account, onCancel, onUpdateSuccess }) => {
    const [formData, setFormData] = useState({
        accountNo: '',
        name: '',
        note: '',
        // Balance is not directly editable in your image, so we'll omit it from the form for PUT
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (account) {
            setFormData({
                accountNo: account.accountNo || '',
                name: account.name || '',
                note: account.note || '',
            });
        }
    }, [account]); // Update form data when the 'account' prop changes

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/${account._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData), // Send updated data
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Account "${formData.name}" updated successfully!`);
                onUpdateSuccess(data.data); // Pass the updated account back to the parent
            } else {
                alert(`Failed to update account: ${data.error || 'Server error'}`);
            }

        } catch (error) {
            alert('A network error occurred. Please check the server connection.');
            console.error('API PUT Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Edit Account</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account No Field - Read-only as per image */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <label htmlFor="accountNo" className="w-full md:w-1/4 text-gray-700 text-sm font-medium mb-1 md:mb-0">
                        Account No
                    </label>
                    <input
                        type="text"
                        id="accountNo"
                        name="accountNo"
                        value={formData.accountNo}
                        readOnly // Make it read-only
                        className="flex-1 border border-gray-300 rounded-md p-2.5 bg-gray-50 text-gray-600 text-sm w-full cursor-not-allowed"
                    />
                </div>

                {/* Name Field */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <label htmlFor="name" className="w-full md:w-1/4 text-gray-700 text-sm font-medium mb-1 md:mb-0">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Account Name"
                        className="flex-1 border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
                        required
                    />
                </div>

                {/* Note Field */}
                <div className="flex flex-col md:flex-row items-start md:items-center">
                    <label htmlFor="note" className="w-full md:w-1/4 text-gray-700 text-sm font-medium mb-1 md:mb-0">
                        Note
                    </label>
                    <textarea
                        id="note"
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        placeholder="Note"
                        rows="3"
                        className="flex-1 border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500 text-sm w-full"
                    ></textarea>
                </div>

                {/* Action Button */}
                <div className="flex justify-start pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-6 rounded-md shadow-sm transition duration-150 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Updating...' : 'Update'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="ml-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-md shadow-sm transition duration-150 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditAccountForm;