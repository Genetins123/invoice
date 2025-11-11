// frontend/src/components/AccountDetailView.jsx
import React from 'react';

const AccountDetailView = ({ account, onBack, onEdit }) => {
    if (!account) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                <p className="text-gray-600">No account details available.</p>
                <button 
                    onClick={onBack}
                    className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md shadow-sm transition duration-150"
                >
                    Back to Accounts
                </button>
            </div>
        );
    }

    // Format the date for display
    const openingDate = account.createdAt 
        ? new Date(account.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Use 24-hour format
          }).replace(',', '') // Remove comma if present
        : 'N/A';

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-gray-700">
                {/* Account No */}
                <div>
                    <p className="text-sm font-medium text-gray-500">Account No</p>
                    <p className="text-base font-semibold">{account.accountNo}</p>
                    <hr className="my-2 border-gray-200" />
                </div>
                {/* Name */}
                <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base font-semibold">{account.name}</p>
                    <hr className="my-2 border-gray-200" />
                </div>
                {/* Balance */}
                <div>
                    <p className="text-sm font-medium text-gray-500">Balance</p>
                    <p className="text-base font-semibold">
                        ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <hr className="my-2 border-gray-200" />
                </div>
                {/* Opening Date */}
                <div>
                    <p className="text-sm font-medium text-gray-500">Opening Date</p>
                    <p className="text-base font-semibold">{openingDate}</p>
                    <hr className="my-2 border-gray-200" />
                </div>
                {/* Note */}
                <div className="md:col-span-2"> {/* Span full width for note */}
                    <p className="text-sm font-medium text-gray-500">Note</p>
                    <p className="text-base font-semibold">{account.note || 'N/A'}</p>
                    <hr className="my-2 border-gray-200" />
                </div>
            </div>

            <div className="mt-8 flex space-x-4">
                <button 
                    onClick={onBack}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md shadow-sm transition duration-150"
                >
                    Back to Accounts
                </button>
                <button 
                    onClick={() => onEdit(account)} // Pass the full account object to the edit handler
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150"
                >
                    Edit Account
                </button>
            </div>
        </div>
    );
};

export default AccountDetailView;