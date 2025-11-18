// src/components/PaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { Loader2 } from 'lucide-react'; // Import for the spinning icon

const PaymentModal = ({ invoice, accounts, onClose, onPaymentSuccess }) => {
    
    const API_URL = 'http://localhost:5000/api'; // Define API URL for clarity
    
    // --- AUTH CONTEXT ---
    const { user, token } = useAuth();
    // --------------------

    // Determine the amount to be paid
    const initialAmount = invoice?.total || 0; 

    // --- STATE MANAGEMENT ---
    const [paymentAmount, setPaymentAmount] = useState(initialAmount.toFixed(2));
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [note, setNote] = useState(`Payment for invoice #${invoice?.invoiceNumber}`);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // ⭐ NEW STATE for unified error reporting
    const [apiError, setApiError] = useState(''); 
    const [validationError, setValidationError] = useState(''); 
    // The previous 'authError' state is now covered by the general 'apiError' 
    // for server-side errors, and the initial '!token' check for client-side warning.
    // ------------------------

    // Filter accounts to show in the dropdown
    const accountOptions = accounts.map(acc => ({
        id: acc._id,
        label: `${acc.name} / ${acc.accountNo}`,
        balance: acc.balance 
    })); 
    
    // Set initial selected account to the first one available
    useEffect(() => {
        if (accountOptions.length > 0 && !selectedAccount) {
            setSelectedAccount(accountOptions[0].id); 
        }
        // Reset amount/note if invoice changes (e.g., if modal is reused)
        setPaymentAmount(initialAmount.toFixed(2));
        setNote(`Payment for invoice #${invoice?.invoiceNumber}`);
    }, [accountOptions, selectedAccount, initialAmount, invoice]);


    const handleMakePayment = async () => {
        // --- 1. CLEAR PREVIOUS ERRORS ---
        setApiError(''); 
        setValidationError('');

        // --- 2. AUTH CHECK ---
        if (!user || !token) {
            setApiError("Authentication required. Your session may have expired.");
            return;
        }

        // --- 3. INPUT VALIDATION ---
        const amount = parseFloat(paymentAmount);
        if (amount <= 0 || isNaN(amount)) {
            setValidationError("Payment amount must be a positive number.");
            return;
        }
        if (!selectedAccount) {
            setValidationError("Please select a target account for the deposit.");
            return;
        }
        if (!invoice?.client?._id) { 
            setValidationError("Critical Error: Invoice is missing client information. Cannot proceed.");
            return;
        }

        setIsProcessing(true);

        const paymentData = {
            invoiceId: invoice._id,
            accountId: selectedAccount,
            amount: amount,
            method: paymentMethod,
            date: paymentDate,
            note: note,
        };

        try {
            // --- Helper data for transaction record ---
            const clientName = invoice.client?.name || invoice.clientName || 'Unknown Client';
            // ⭐ Improved transaction reference
            const transactionSource = `Payment for Invoice #${invoice.invoiceNumber} from ${clientName}`; 
            const authHeader = { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            };

            // --- API Call 1: Update Invoice Status (Set to 'Paid') ---
            const updateInvoiceResponse = await fetch(`${API_URL}/invoices/${invoice._id}`, {
                method: 'PUT',
                headers: authHeader, 
                body: JSON.stringify({ status: 'Paid' }), 
            });

            if (!updateInvoiceResponse.ok) {
                const errorData = await updateInvoiceResponse.json();
                throw new Error(errorData.message || "Failed to update invoice status.");
            }

            // --- API Call 2: Record Transaction (Post to Account/Transaction API) ---
            const recordTransactionResponse = await fetch(`${API_URL}/transactions`, { 
                method: 'POST',
                headers: authHeader,
                body: JSON.stringify({
                    type: 'Income',
                    source: transactionSource, // Use the clear reference
                    amount: paymentData.amount,
                    accountId: paymentData.accountId,
                    date: paymentData.date,
                    paymentMethod: paymentData.method,
                    reference: paymentData.note || transactionSource, 
                    clientId: invoice.client._id, 
                    clientName: clientName, 
                }),
            });
            
            if (!recordTransactionResponse.ok) {
                const errorData = await recordTransactionResponse.json();
                // If transaction fails but invoice status succeeded, alert the user but continue success flow
                // In a production app, robust rollback or warning is needed here.
                console.warn(`Transaction record failed: ${errorData.message}. Invoice status was updated to Paid, but ledger may be incorrect.`);
            }

            // Success
            onPaymentSuccess(); 

        } catch (error) {
            console.error(`Payment failed: ${error.message}`);
            // ⭐ Use the unified state for server errors
            setApiError(error.message); 
        } finally {
            setIsProcessing(false);
        }
    };

    if (!invoice) return null;
    
    // Determine if the main action button should be disabled
    const isPaymentDisabled = isProcessing || !selectedAccount || parseFloat(paymentAmount) <= 0 || !token;


    // Basic Modal Structure (Tailwind)
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white transform transition-all">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <h3 className="text-2xl font-extrabold text-purple-700">Record Payment</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-1 leading-none transition-colors">&times;</button>
                </div>
                
                {/* --- 1. Validation Error Message --- */}
                {validationError && (
                    <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-900 rounded-md">
                        <p className="font-semibold">Validation Failed</p>
                        <p className="text-sm">{validationError}</p>
                    </div>
                )}

                {/* --- 2. API/Server Error Message --- */}
                {apiError && (
                    <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-900 rounded-md">
                        <p className="font-semibold">Transaction Error</p>
                        <p className="text-sm">{apiError}</p>
                    </div>
                )}
                
                {/* --- 3. Authentication Warning --- */}
                {!token && (
                    <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md">
                        <p className="font-semibold">Authentication Required</p>
                        <p className="text-sm">You must be logged in to record financial transactions.</p>
                    </div>
                )}

                {/* --- Invoice Summary Block --- */}
                <div className="mt-4 p-3 bg-purple-50 border-l-4 border-purple-400 text-purple-800 rounded-md">
                    <p className="font-semibold">Invoice: <span className="font-mono">#{invoice.invoiceNumber}</span></p>
                    <p>Client: <span className="font-medium">{invoice.client?.name || invoice.clientName || 'N/A'}</span></p>
                    <p>Amount Due: <span className="font-bold text-lg">${(invoice.total || 0).toFixed(2)}</span></p>
                </div>


                <div className="space-y-4 mt-4">
                    {/* Amount and Date */}
                    <div className="flex space-x-4">
                        <div className="w-1/2">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Amount</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 shadow-sm"
                                placeholder="$ 0.00"
                                step="0.01"
                                required
                                disabled={!token}
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Date</label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 shadow-sm"
                                required
                                disabled={!token}
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                            disabled={!token}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Card">Card</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>

                    {/* Account Dropdown */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Deposit Account</label>
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                            disabled={!token}
                        >
                            {accountOptions.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Note / Reference</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows="2"
                            className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                            placeholder="Payment note"
                            disabled={!token}
                        ></textarea>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end pt-5 space-x-3 border-t border-gray-200 mt-5">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="py-2 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition duration-150 shadow-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMakePayment}
                        disabled={isPaymentDisabled} 
                        className="py-2 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition duration-150 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isProcessing ? (
                            <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        ) : 'Confirm & Record Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;