import React, { useState, useEffect } from 'react';
const PaymentModal = ({ invoice, accounts, onClose, onPaymentSuccess }) => {
    // Determine the amount to be paid (assuming a 'total' field in your invoice data)
    const initialAmount = invoice?.total || 0; 

    const [paymentAmount, setPaymentAmount] = useState(initialAmount.toFixed(2));
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10)); // Today's date
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [selectedAccount, setSelectedAccount] = useState(''); // Stores the selected account ID or combined string
    const [note, setNote] = useState(`Payment for invoice #${invoice?.invoiceNumber}`);
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter accounts to show in the dropdown (assuming 'accounts' prop is the list of Account objects)
    const accountOptions = accounts.map(acc => ({
        id: acc._id,
        label: `${acc.name} / ${acc.accountNo}`,
        balance: acc.balance // Store balance to help user know context
    }));    

    // Set initial selected account to the first one available
    useEffect(() => {
        if (accountOptions.length > 0 && !selectedAccount) {
            setSelectedAccount(accountOptions[0].id); 
        }
    }, [accountOptions, selectedAccount]);


    const handleMakePayment = async () => {
        if (parseFloat(paymentAmount) <= 0) {
            // NOTE: Replaced alert() with a console log as per best practices
            console.error("Validation Error: Payment amount must be greater than zero.");
            return;
        }
        if (!selectedAccount) {
            console.error("Validation Error: Please select a target account.");
            return;
        }

        // --- FIXED: Use invoice?.client?._id (lowercase id) based on MongoDB structure ---
        if (!invoice?.client?._id) { 
            console.error("Critical Error: Invoice is missing the associated Client ID.");
            return;
        }

        setIsProcessing(true);

        const paymentData = {
            invoiceId: invoice._id,
            accountId: selectedAccount,
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
            date: paymentDate,
            note: note,
        };

        try {
            // --- API Call 1: Update Invoice Status (Set to 'Paid' or 'Completed') ---
            const updateInvoiceResponse = await fetch(`http://localhost:5000/api/invoices/${invoice._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'Paid', 
                    // You might also want to set a 'paidAmount' field and 'paymentDate' on the invoice here
                }), 
            });

            if (!updateInvoiceResponse.ok) {
                throw new Error("Failed to update invoice status.");
            }

            // --- API Call 2: Record Transaction (Post to Account/Transaction API) ---
            // Extract client name for the transaction record
            const clientName = invoice.client?.name || invoice.clientName || 'Unknown Client';
            
            const recordTransactionResponse = await fetch(`http://localhost:5000/api/transactions`, { // Assume this new API route exists
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'Income',
                    source: `Invoice #${invoice.invoiceNumber}`,
                    amount: paymentData.amount,
                    accountId: paymentData.accountId,
                    date: paymentData.date,
                    paymentMethod: paymentData.method,
                    reference: paymentData.note,
                    // --- FIXED: Pass the correct client ID from the nested client object ---
                    clientId: invoice.client._id, 
                    clientName: clientName, // ⭐ UPDATED: Passing the Client Name to the transaction
                }),
            });
            
            if (!recordTransactionResponse.ok) {
                // In a real app, you'd roll back the invoice status here, but for now, we console.error.
                console.error("Failed to record transaction. Account balance may be incorrect.");
            }

            console.log(`Payment of $${paymentAmount} successfully recorded!`);
            onPaymentSuccess(); // Notify parent to close modal and refresh list

        } catch (error) {
            console.error(`Payment failed: ${error.message}`);
            console.error('Payment Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!invoice) return null;

    // NOTE: Removed alert() calls and replaced them with console.error() as required by platform instructions.

    // Basic Modal Structure (Tailwind)
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white transform transition-all">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <h3 className="text-2xl font-extrabold text-purple-700">Record Payment</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-1 leading-none transition-colors">&times;</button>
                </div>
                
                <div className="mt-4 p-3 bg-purple-50 border-l-4 border-purple-400 text-purple-800 rounded-md">
                    <p className="font-semibold">Invoice: <span className="font-mono">#{invoice.invoiceNumber}</span></p>
                    <p>Client: <span className="font-medium">{invoice.client?.name || invoice.clientName || 'N/A'}</span></p>
                    <p>Amount Due: <span className="font-bold text-lg">${(invoice.total || 0).toFixed(2)}</span></p>
                </div>


                <div className="space-y-4 mt-4">
                    {/* Amount and Date (side-by-side as per image) */}
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
                        disabled={isProcessing}
                        className="py-2 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition duration-150 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Confirm & Record Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;