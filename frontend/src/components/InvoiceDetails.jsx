// src/components/InvoiceDetails.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowLeft, Printer } from 'lucide-react'; 

const API_URL = 'http://localhost:5000/api';

const InvoiceDetails = ({ invoiceId, goBack }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch the full invoice details (relying on the backend /api/invoices/:id route)
  const fetchInvoiceDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetches the invoice with populated client details
      const response = await fetch(`${API_URL}/invoices/${invoiceId}`);

      if (!response.ok) {
        throw new Error(`Invoice not found or server error (Status: ${response.status})`);
      }

      const data = await response.json();
      setInvoice(data);

    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setError(err.message || 'Failed to load invoice details.');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  // Function to trigger the browser's native print dialog for the HTML content
  const handlePrint = () => {
    window.print();
  };

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="p-8 text-center text-indigo-600 flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="animate-spin mb-3" size={32} />
        Loading invoice details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 font-semibold rounded-lg flex flex-col items-center">
        <p className="font-bold mb-2">Error:</p> {error}
      </div>
    );
  }
  
  if (!invoice) {
    return <div className="p-8 text-center text-gray-600">No invoice data found.</div>;
  }

  const client = invoice.client || {}; 

  // --- Render Invoice Details ---
  return (
    <div className="p-8 bg-gray-50 flex-1 min-h-screen">
      
      {/* Control Bar: Hidden when printing using the 'no-print' class */}
      <div className="flex justify-between items-center mb-6 border-b pb-4 no-print">
        <h2 className="text-3xl font-bold text-gray-900">Invoice Details #{invoice.invoiceNumber}</h2>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors p-2 rounded-lg shadow-md"
          >
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button
            onClick={goBack}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors bg-white border border-gray-300 p-2 rounded-lg"
          >
            <ArrowLeft size={16} />
            <span>Back to List</span>
          </button>
        </div>
      </div>
      
      {/* Main Content: Apply 'print-container' for print optimization */}
      <div className="print-container"> 
        
        {/* Invoice Header (Similar to Image Layout) */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-start mb-6 border-b border-print pb-4">
            <div>
              <h1 className="text-4xl font-extrabold text-indigo-700 mb-1">IV</h1>
              <p className="text-sm text-gray-500">Invoice Status: <span className={`font-semibold ${invoice.status === 'Paid' ? 'text-green-600' : invoice.status === 'Due' ? 'text-yellow-600' : 'text-red-600'}`}>{invoice.status}</span></p>
            </div>
            <div className="text-right bg-gray-100 p-4 rounded-lg">
              <h3 className="text-xl font-bold text-gray-800">INVOICE</h3>
              <p className="text-sm font-semibold">Invoice Number: #{invoice.invoiceNumber}</p>
              <p className="text-sm">Date: {new Date(invoice.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Company vs Client Info */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            {/* Company Details (Dummy data) */}
            <div className="p-4 border-r border-gray-200 border-print">
              <h4 className="text-lg font-bold text-gray-700 mb-2">Company Name</h4>
              <p>Phone: 00000000</p>
              <p>Email: iv@example.com</p>
              <p>Business Number: 0000</p>
            </div>

            {/* Client Details */}
            <div className="p-4">
              <h4 className="text-lg font-bold text-gray-700 mb-2">{client.name || 'N/A'}</h4>
              <p>Phone: {client.phone || 'N/A'}</p>
              <p>Email: {client.email || 'N/A'} | Address: {client.address || 'N/A'}</p>
              <p>Business Number: {client.businessNumber || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-6">
          <table className="min-w-full">
            <thead className="bg-indigo-50 border-b border-indigo-200">
              <tr>
                {['Product', 'Amount', 'Price', 'Discount (%)', 'Total (€)'].map(header => (
                  <th key={header} className="p-4 text-left text-sm font-semibold text-indigo-700 uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{item.productName}</td>
                  <td className="p-4 text-center text-gray-600">{item.amount}</td>
                  <td className="p-4 text-right text-gray-600">{item.price.toFixed(2)} €</td>
                  <td className="p-4 text-center text-gray-600">{item.discountPercent.toFixed(2)} %</td>
                  <td className="p-4 text-right font-semibold text-gray-800">{item.totalLineItem.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment and Totals Summary */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm bg-gray-100 p-6 rounded-xl shadow-inner space-y-3">
            <div className="text-sm border-b border-print pb-3 border-gray-300">
              <h5 className="font-bold text-gray-700">Payment Info</h5>
              <p className="text-gray-600">ProCredit Bank : 1234883773883773773</p>
            </div>
            
            <div className="flex justify-between text-base text-gray-700 pt-2">
              <span>Total Without VAT</span>
              <span className="font-medium">{parseFloat(invoice.totalWithoutVAT).toFixed(2)} €</span>
            </div>
              <div className="flex justify-between text-base text-gray-700">
                <span>Total VAT (18%)</span>
                <span className="font-medium">{parseFloat(invoice.totalVAT).toFixed(2)} €</span>
              </div>
            <div className="flex justify-between font-bold text-gray-900 text-2xl pt-2 border-t border-gray-300 border-print">
              <span>Grand Total</span>
              <span className="text-green-600">{parseFloat(invoice.total).toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 text-sm text-gray-600">
          <h5 className="font-bold mb-1">Note:</h5>
          <p className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm min-h-[50px]">{invoice.notes || 'No specific notes for this invoice.'}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;