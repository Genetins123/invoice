import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Trash2, PlusCircle, RotateCcw, Loader2 } from 'lucide-react'; 

// Set the new API base URL as requested
const API_URL = 'http://localhost:5000/api';

const AddInvoice = ({ goBack }) => {
  // Dynamic data states fetched from API
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [note, setNote] = useState('');
  
  // State for the product currently being added
  const [newProductEntry, setNewProductEntry] = useState({
    productId: '', // Now stores the MongoDB ObjectId
    price: '', // Price input (can be modified by user)
    amount: '',
    discount: '0'
  });

  // --- DATA FETCHING (Clients & Products) ---
  const fetchDynamicData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/clients`),
        fetch(`${API_URL}/products`)
      ]);

      if (!clientsRes.ok || !productsRes.ok) {
        throw new Error('Failed to fetch clients or products. Check server logs.');
      }

      const clientsData = await clientsRes.json();
      const productsData = await productsRes.json();

      setClients(clientsData);
      setProducts(productsData);
      
      // Auto-select the first client if available
      if (clientsData.length > 0) {
        setSelectedClientId(clientsData[0]._id);
      }
    } catch (err) {
      console.error('API Fetch Error:', err);
      setError('Could not connect to API or load data. Is the Node.js server running on port 5000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDynamicData();
  }, [fetchDynamicData]);


  // --- Helper Lookups and Calculations ---
  
  // Map for quick product lookup by ID
  const productMap = useMemo(() => {
    return new Map(products.map(p => [p._id, p]));
  }, [products]);

  // Find the currently selected client for display
  const selectedClient = useMemo(() => {
    return clients.find(c => c._id === selectedClientId);
  }, [clients, selectedClientId]);

  // Client-side totals calculation for immediate UI feedback
  const totals = useMemo(() => {
    let subtotal = 0;
    lineItems.forEach(item => {
      // The lineSubtotal is already calculated when the item is added
      subtotal += item.lineSubtotal;
    });

    // Assuming a fixed 18% VAT for client-side estimation, as in your original file
    const estimatedVat = subtotal * 0.18; 
    const totalWithVAT = subtotal + estimatedVat; 
    
    return { subtotal, estimatedVat, totalWithVAT };
  }, [lineItems]);


  // --- HANDLERS ---
  const handleClientChange = (e) => {
    setSelectedClientId(e.target.value);
  };
  
  const handleProductEntryChange = (e) => {
    const { name, value } = e.target;
    let updatedEntry = { ...newProductEntry, [name]: value };

    // Auto-fill price when a product is selected
    if (name === 'productId' && value) {
      const product = productMap.get(value);
      if (product) {
        updatedEntry.price = product.price.toFixed(2);
      } else {
        updatedEntry.price = '';
      }
    }
    setNewProductEntry(updatedEntry);
  };

  const handleAddItem = () => {
    const { productId, price, amount, discount } = newProductEntry;
    
    // Basic validation
    if (!productId || !price || !amount || parseFloat(amount) <= 0) {
        // Use a better UI notification than console.error in a real app
        console.error('Validation failed: Missing product, price, or amount.');
        return; 
    }

    const productInfo = productMap.get(productId);
    const priceFloat = parseFloat(price);
    const amountInt = parseInt(amount);
    const discountFloat = parseFloat(discount || 0);
    
    // Calculate subtotal for the line item
    const lineSubtotal = priceFloat * amountInt * (1 - discountFloat / 100);

    const newItem = {
      productId,
      productName: productInfo.name, // Display name
      price: priceFloat,
      discount: discountFloat,
      amount: amountInt,
      lineSubtotal: lineSubtotal,
    };

    setLineItems([...lineItems, newItem]);
    // Reset form for next entry
    setNewProductEntry({ productId: '', price: '', amount: '', discount: '0' }); 
  };

  const handleDeleteItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleResetForm = () => {
    // Reset all states
    setSelectedClientId(clients.length > 0 ? clients[0]._id : '');
    setLineItems([]);
    setNote('');
    setNewProductEntry({ productId: '', price: '', amount: '', discount: '0' });
  };
  
  // --- Save Invoice API Call (POST) ---
  const handleSaveInvoice = async () => {
    if (!selectedClientId || lineItems.length === 0) {
      // Replace with custom modal/toast
      alert('Please select a client and add at least one line item.');
      return;
    }

    // Get the calculated totals from the useMemo hook (FIX)
    const { subtotal, estimatedVat, totalWithVAT } = totals; 

    // Prepare data for server submission
    const invoiceData = {
      clientId: selectedClientId,
      lineItems: lineItems.map(item => ({
        // Use keys that match the Mongoose schema ('productID', 'discountPercent', 'totalLineItem')
        productID: item.productId, 
        productName: item.productName, // Added productName for server
        price: item.price, 
        amount: item.amount,
        discountPercent: item.discount, // Renamed to match schema
        totalLineItem: item.lineSubtotal.toFixed(2), // Added and formatted to 2 decimal places
      })),
      note: note,
      
      // ADDED REQUIRED TOTAL FIELDS (FIX)
      totalWithoutVAT: subtotal.toFixed(2), 
      totalVAT: estimatedVat.toFixed(2),
      total: totalWithVAT.toFixed(2),
    };
    
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Invoice saved successfully:', result.invoice);
      // Replace with custom modal/toast
      alert('Invoice Saved Successfully! ID: ' + result.invoice._id);
      
      handleResetForm(); // Clear the form
      if (goBack) goBack(); // Go back to the main view/dashboard
      
    } catch (err) {
      console.error('Save Error:', err);
      // Replace with custom modal/toast
      alert(`Failed to save invoice: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };


  // --- Render Logic ---
  if (loading) {
    return (
        <div className="p-8 text-center text-indigo-600 flex flex-col items-center justify-center h-full min-h-[400px]">
            <Loader2 className="animate-spin mb-3" size={32} />
            Loading clients and products from API...
        </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center bg-red-100 border border-red-400 text-red-700 font-semibold rounded-lg">{error}</div>;
  }
  
  return (
    <div className="p-8 bg-gray-50 flex-1 min-h-screen">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-900">Add New Invoice</h2>
        <button
          onClick={handleResetForm}
          className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 transition-colors bg-red-50 p-2 rounded-lg"
        >
          <RotateCcw size={16} />
          <span>Reset Form</span>
        </button>
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 p-2 rounded-lg"
        >
          <span>Go Back</span>
        </button>
      </div>

      <div className="flex gap-8">
        
        {/* Left Section: Product Entry and Line Items */}
        <div className="flex-1 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Line Items</h3>
          
          {/* Add Item Row */}
          <div className="grid grid-cols-6 gap-3 mb-6 items-end">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-700">Select Product</label>
              <select
                name="productId"
                value={newProductEntry.productId}
                onChange={handleProductEntryChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 text-gray-900 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a Product...</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} (Price: {p.price.toFixed(2)}€)</option>
                ))}
              </select>
            </div>
            
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-700">Price (€)</label>
              <input 
                type="number" 
                name="price" 
                placeholder="0.00" 
                value={newProductEntry.price} 
                onChange={handleProductEntryChange} 
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-right" 
                step="0.01"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-700">Amount</label>
              <input 
                type="number" 
                name="amount" 
                placeholder="1" 
                value={newProductEntry.amount} 
                onChange={handleProductEntryChange} 
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-center" 
                min="1"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs font-medium text-gray-700">Discount (%)</label>
              <input 
                type="number" 
                name="discount" 
                placeholder="0" 
                value={newProductEntry.discount} 
                onChange={handleProductEntryChange} 
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-center" 
                min="0" max="100"
              />
            </div>

            <button
              onClick={handleAddItem}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-3 rounded-lg transition-colors col-span-1 flex items-center justify-center space-x-1 shadow-md hover:shadow-lg"
              disabled={!newProductEntry.productId || !newProductEntry.amount || parseFloat(newProductEntry.amount) <= 0}
            >
              <PlusCircle size={18} />
              <span>Add</span>
            </button>
          </div>
          
          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 mt-6">
              <thead className="bg-gray-50">
                <tr>
                  {['Product Name', 'Price (€)', 'Discount (%)', 'Amount', 'Subtotal (€)', ''].map(header => (
                    <th key={header} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-3 py-8 text-center text-sm text-gray-500 italic">
                      Start by selecting a product above to add a line item.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{item.price.toFixed(2)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{item.discount.toFixed(0)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{item.amount}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-right">{item.lineSubtotal.toFixed(2)}€</td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDeleteItem(index)}
                          className="text-red-600 hover:text-red-700 p-1 rounded-full transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Section: Client Info and Totals */}
        <div className="w-96 bg-white p-6 rounded-xl shadow-lg flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Invoice Summary</h3>
          
          {/* Client Selector */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Select Client</label>
            <select
              value={selectedClientId || ''}
              onChange={handleClientChange}
              className="w-full border border-gray-300 rounded-lg shadow-sm p-2.5 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {clients.length === 0 ? (
                <option value="" disabled>No clients loaded</option>
              ) : (
                clients.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))
              )}
            </select>
          </div>
          
          {/* Selected Client Display */}
          {selectedClient ? (
            <div className="text-sm text-gray-600 mb-6 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="font-bold text-indigo-800">{selectedClient.name}</p>
              <p>Phone: {selectedClient.phone || 'N/A'}</p>
              <p>Address: {selectedClient.address || 'N/A'}</p>
            </div>
          ) : (
             <div className="text-sm text-gray-500 mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
               No client selected.
             </div>
          )}
          
          {/* Note Section */}
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Note:</h3>
          <textarea 
            rows="3" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-green-500 focus:border-green-500 resize-none mb-6 text-sm"
            placeholder="Add any specific notes here..."
          ></textarea>

          {/* Totals Summary */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-base text-gray-600">
              <span>Subtotal (Net)</span>
              <span className="font-medium">{totals.subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 border-b pb-2">
              <span>Estimated VAT (18%)</span>
              <span className="font-medium">{totals.estimatedVat.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-2xl pt-2">
              <span>Grand Total</span>
              <span className="text-green-600">{totals.totalWithVAT.toFixed(2)}€</span>
            </div>
            
          </div>
          
          {/* Save Button */}
          <button
            onClick={handleSaveInvoice}
            className={`w-full mt-6 text-white font-extrabold py-3 px-4 rounded-lg shadow-xl transition-all duration-200 transform ${
              isSaving || lineItems.length === 0 || !selectedClientId
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01]'
            } flex items-center justify-center space-x-2`}
            disabled={isSaving || lineItems.length === 0 || !selectedClientId}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Invoice</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddInvoice;