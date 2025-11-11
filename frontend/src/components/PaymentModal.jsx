// src/components/PaymentModal.jsx
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
            alert("Payment amount must be greater than zero.");
            return;
        }
        if (!selectedAccount) {
            alert("Please select a target account.");
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
            // This is crucial for updating the account balance (Company Sales Account / 12345678)
            const recordTransactionResponse = await fetch(`http://localhost:5000/api/transactions`, { // Assume this new API route exists
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'Income',
                    source: `Invoice #${invoice.invoiceNumber}`,
                    amount: paymentData.amount,
                    accountId: paymentData.accountId,
                    date: paymentData.date,
                    reference: paymentData.note,
                }),
            });
            
            if (!recordTransactionResponse.ok) {
                 // In a real app, you'd roll back the invoice status here, but for now, we alert.
                 console.error("Failed to record transaction. Account balance may be incorrect.");
            }

            alert(`Payment of $${paymentAmount} successfully recorded!`);
            onPaymentSuccess(); // Notify parent to close modal and refresh list

        } catch (error) {
            alert(`Payment failed: ${error.message}`);
            console.error('Payment Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!invoice) return null;

    // Basic Modal Structure (Tailwind)
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-1/3 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center pb-3">
                    <h3 className="text-xl font-bold text-gray-900">Payment Confirmation</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                <div className="space-y-4">
                    {/* Amount and Date (side-by-side as per image) */}
                    <div className="flex space-x-4">
                        <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-1/2 p-2 border border-gray-300 rounded-md"
                            placeholder="$ 0"
                            step="0.01"
                            required
                        />
                        <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-1/2 p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Payment Method</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mt-1"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Card">Card</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>

                    {/* Account Dropdown */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Account</label>
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mt-1"
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
                        <label className="text-sm font-medium text-gray-700">Note</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows="2"
                            className="w-full p-2 border border-gray-300 rounded-md mt-1"
                            placeholder="Payment note"
                        ></textarea>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end pt-4 space-x-2">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleMakePayment}
                        disabled={isProcessing}
                        className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md disabled:opacity-50"
                    >
                        {isProcessing ? 'Processing...' : 'Make Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;