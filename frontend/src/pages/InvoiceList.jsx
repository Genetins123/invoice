// src/pages/InvoiceList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import AddInvoice from '../components/AddInvoice'; 
import InvoiceDetails from '../components/InvoiceDetails';
import { Loader2, AlertTriangle, Printer, Eye, Download } from 'lucide-react'; 

const API_URL = 'http://localhost:5000/api';

// Accept setIsDetailsView and provide a default empty function for safety
const InvoiceList = ({ setIsDetailsView = () => {} }) => { 
  // --- 1. STATE DECLARATIONS (Missing in your provided block) ---
  const [view, setView] = useState('list'); 
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null); 
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 2. FETCH FUNCTION (Missing in your provided block) ---
  // Function to fetch the list of invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/invoices`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInvoices(data);

    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Check if the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []); // fetchInvoices is now correctly defined

  // Function to update the view state (and inform the parent)
  const updateView = (newView, id = null) => {
    setView(newView);
    setSelectedInvoiceId(id);
    // Tell the parent (App.jsx) to hide the sidebar if we are viewing details
    setIsDetailsView(newView === 'details'); 
  };
    
  // Function to return to the list view
  const goBackToList = () => {
    updateView('list');
  };

  useEffect(() => {
    fetchInvoices();
    // Re-fetch list whenever we come back to the 'list' view
  }, [fetchInvoices, view]); 
  
  // Triggers the backend PDF download (remains the same)
  const handlePrintPDF = (invoiceId) => {
    window.open(`${API_URL}/invoices/${invoiceId}/pdf`, `_blank`);
  };

  // --- RENDER LOGIC: Switch between views ---
  
  if (view === 'add') {
    return <AddInvoice goBack={goBackToList} />;
  }
  
  if (view === 'details' && selectedInvoiceId) {
    // The InvoiceDetails component will now take up the full screen width
    return <InvoiceDetails 
      invoiceId={selectedInvoiceId} 
      goBack={goBackToList} // Use the new function
    />;
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-indigo-600 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin mb-3" size={32} />
        Loading invoices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 font-semibold rounded-lg flex items-center justify-center space-x-2">
        <AlertTriangle size={20} />
        <span>{error}</span>
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-gray-50 flex-1 min-h-screen">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-900">Invoice List</h2>
        
        <button 
          onClick={() => updateView('add')} // Use the new updateView function
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors flex items-center"
        >
          <span className="mr-2">+</span>
          Add New Invoice
        </button>
      </div>

      <p className="text-gray-500 mb-6 font-medium">
        {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'} Found
      </p>

      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
      {invoices.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No invoices found. Click "Add New Invoice" to get started.
          </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Invoice #', 'Date', 'Client Name', 'Total (€)', 'Status', 'Actions'].map((header) => (
                <th 
                  key={header} 
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Actions' ? 'text-right' : ''}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-600">#{invoice.invoiceNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{invoice.client?.name || 'Unknown Client'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900">{parseFloat(invoice.total).toFixed(2)}€</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                      invoice.status === 'Due' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {invoice.status}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button 
                    onClick={() => handlePrintPDF(invoice._id)}
                    title="Download PDF" 
                    className="text-indigo-600 hover:text-indigo-900 p-1 transition-colors"
                  >
{/*                     <Printer size={18} /> */}
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => updateView('details', invoice._id)} // ⬅️ Correctly uses updateView
                    title="View Details" 
                    className="text-blue-600 hover:text-blue-900 p-1 transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default InvoiceList;