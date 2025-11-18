// import React, { useState, useEffect } from 'react';
// import { Loader2, X, Plus, AlertTriangle } from 'lucide-react'; // ⬅️ ADDED AlertTriangle
// import { useAuth } from '../context/AuthContext'; // ⬅️ NEW: Import useAuth

// const API_URL = 'http://localhost:5000/api';

// // Initial state for a new invoice item
// const initialItem = {
//     barcode: '',
//     product: '',
//     price: 0,
//     amount: 1, // Represents quantity
//     discount: 0, // Percentage
//     total: 0,
// };

// const AddInvoice = ({ goBack }) => {
//     // ⬅️ NEW: Authentication check
//     const { isAuthenticated } = useAuth();
    
//     // --- STATE ---
//     const [clients, setClients] = useState([]);
//     const [products, setProducts] = useState([]);
//     const [selectedClient, setSelectedClient] = useState(null);
//     const [invoiceItems, setInvoiceItems] = useState([]);
//     const [note, setNote] = useState('');
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [loadingInitialData, setLoadingInitialData] = useState(true);
//     const [formError, setFormError] = useState(null);

//     // State for the product being added (top input section)
//     const [newItem, setNewItem] = useState(initialItem);
//     const [selectedProduct, setSelectedProduct] = useState(null); // The actual product object

//     // --- CALCULATED VALUES ---
//     const subtotal = invoiceItems.reduce((acc, item) => acc + item.total, 0);
//     const vatRate = 0.23; // Assuming 23% VAT rate
//     const vatAmount = subtotal * vatRate;
//     const totalWithVAT = subtotal + vatAmount;

//     // --- DATA FETCHING ---
//     useEffect(() => {
//         const fetchInitialData = async () => {
//             try {
//                 const [clientsRes, productsRes] = await Promise.all([
//                     fetch(`${API_URL}/clients`),
//                     fetch(`${API_URL}/products`),
//                 ]);

//                 if (!clientsRes.ok || !productsRes.ok) {
//                     throw new Error('Failed to fetch initial data.');
//                 }

//                 const clientsData = await clientsRes.json();
//                 const productsData = await productsRes.json();

//                 setClients(clientsData);
//                 setProducts(productsData);
//                 if (clientsData.length > 0) {
//                     // Set the first client as default
//                     setSelectedClient(clientsData[0]); 
//                 }
//             } catch (error) {
//                 console.error('Initial data fetch error:', error);
//                 setFormError('Could not load clients or products. Check API connection.');
//             } finally {
//                 setLoadingInitialData(false);
//             }
//         };

//         // ⬅️ MODIFIED: Only fetch if authenticated
//         if (isAuthenticated) {
//             fetchInitialData();
//         } else {
//             setLoadingInitialData(false);
//             setFormError('Authentication required to create an invoice.');
//         }
//     }, [isAuthenticated]); // ⬅️ ADDED isAuthenticated dependency

//     // --- ITEM LOGIC ---
    
//     // Handles selecting a product from the dropdown
//     const handleProductSelect = (e) => {
//         const selectedBarcode = e.target.value;
//         const product = products.find(p => p.barcode === selectedBarcode);

//         if (product) {
//             setSelectedProduct(product);
//             setNewItem({
//                 ...newItem,
//                 barcode: product.barcode,
//                 product: product.name,
//                 price: product.price,
//                 total: product.price * newItem.amount * (1 - newItem.discount / 100),
//             });
//         } else {
//             setSelectedProduct(null);
//             setNewItem(initialItem);
//         }
//     };

//     // Handles changes in price, amount, or discount for the item being added
//     const handleNewItemChange = (e) => {
//         const { name, value } = e.target;
//         let updatedItem = { ...newItem, [name]: parseFloat(value) || 0 };

//         if (name === 'product' || name === 'barcode') return; // Handled by select

//         const price = updatedItem.price;
//         const amount = updatedItem.amount;
//         const discount = updatedItem.discount; // as a percentage

//         // Calculate total for the item
//         const discountedPrice = price * (1 - discount / 100);
//         updatedItem.total = discountedPrice * amount;

//         setNewItem(updatedItem);
//     };
    
//     // Adds the current item to the invoice list
//     const handleAddItem = () => {
//         if (!selectedProduct) {
//             alert('Please select a product.');
//             return;
//         }
//         if (newItem.amount <= 0) {
//             alert('Amount must be greater than zero.');
//             return;
//         }

//         const itemToAdd = {
//             barcode: newItem.barcode,
//             product: newItem.product,
//             price: newItem.price,
//             amount: newItem.amount,
//             discount: newItem.discount,
//             total: newItem.total, // Already calculated
//             // Assuming a unique ID might be needed for the key if we allowed editing
//         };

//         setInvoiceItems([...invoiceItems, itemToAdd]);
//         // Reset the input fields after adding
//         setSelectedProduct(null);
//         setNewItem(initialItem);
//     };

//     // Removes an item from the invoice list
//     const handleDeleteItem = (index) => {
//         setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
//     };

//     // --- SUBMISSION ---
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setFormError(null);

//         if (!selectedClient) {
//             setFormError('Please select a client.');
//             return;
//         }

//         if (invoiceItems.length === 0) {
//             setFormError('The invoice must contain at least one product.');
//             return;
//         }

//         setIsSubmitting(true);
        
//         // Construct the payload for the backend API
//         const invoicePayload = {
//             client: selectedClient._id, // Use the client ID for the backend
//             items: invoiceItems.map(item => ({
//                 barcode: item.barcode,
//                 productName: item.product,
//                 unitPrice: item.price,
//                 quantity: item.amount,
//                 discount: item.discount, // Store as percentage
//                 lineTotal: item.total,
//             })),
//             subtotal: subtotal,
//             vat: vatAmount,
//             total: totalWithVAT,
//             status: 'Due', // Default status for a new invoice
//             note: note,
//             date: new Date().toISOString(),
//             // The backend should handle generating invoiceNumber
//         };
        
//         try {
//             const response = await fetch(`${API_URL}/invoices`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(invoicePayload),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to create invoice.');
//             }

//             alert('✅ Invoice created successfully!');
//             goBack(); // Navigate back to the Invoice List
//         } catch (error) {
//             console.error('Invoice creation error:', error);
//             setFormError(error.message);
//         } finally {
//             setIsSubmitting(false);
//         }
//     };


//     // --- RENDER CONTENT ---
    
//     // ⬅️ NEW: Authentication Block
//     if (!isAuthenticated) {
//         return (
//             <div className="p-8 text-center bg-yellow-100 border border-yellow-400 text-yellow-700 font-semibold rounded-lg flex flex-col items-center justify-center h-full min-h-[400px]">
//                 <AlertTriangle size={32} className="mb-3" />
//                 <span>You must be logged in to create an invoice.</span>
//                 <button onClick={goBack} className="mt-4 text-indigo-600 hover:text-indigo-900 font-bold">
//                     Go Back to List
//                 </button>
//             </div>
//         );
//     }

//     if (loadingInitialData) {
//         return (
//             <div className="p-8 text-center text-indigo-600 flex flex-col items-center justify-center h-full min-h-[400px]">
//                 <Loader2 className="animate-spin mb-3" size={32} />
//                 Loading clients and products...
//             </div>
//         );
//     }

//     return (
//         <div className="p-8 bg-gray-50 flex-1 min-h-screen">
//             <header className="flex justify-between items-center mb-6 border-b pb-4">
//                 <h2 className="text-3xl font-bold text-gray-900">Add New Invoice</h2>
//                 <button 
//                     onClick={goBack} 
//                     className="text-gray-500 hover:text-gray-800 transition-colors p-2 rounded-full"
//                     title="Go back to list"
//                 >
//                     <X size={24} />
//                 </button>
//             </header>

//             <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
                
//                 {/* --- LEFT SIDE: Invoice Items --- */}
//                 <div className="flex-1 space-y-6">
                    
//                     {/* 1. Add Product Form */}
//                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
//                         <h3 className="text-xl font-semibold text-gray-800 mb-4">Select Product</h3>
//                         <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            
//                             {/* Product Select */}
//                             <div className="col-span-2">
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
//                                 <select
//                                     value={selectedProduct ? selectedProduct.barcode : ''}
//                                     onChange={handleProductSelect}
//                                     className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
//                                 >
//                                     <option value="">Select a product...</option>
//                                     {products.map((product) => (
//                                         <option key={product._id} value={product.barcode}>
//                                             {product.name}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             {/* Price (€) - Read Only */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Price (€)</label>
//                                 <input
//                                     type="number"
//                                     name="price"
//                                     value={newItem.price.toFixed(2)}
//                                     readOnly
//                                     className="w-full border border-gray-300 bg-gray-100 rounded-lg p-2.5 text-gray-600"
//                                 />
//                             </div>

//                             {/* Amount (Quantity) */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
//                                 <input
//                                     type="number"
//                                     name="amount"
//                                     min="1"
//                                     step="1"
//                                     value={newItem.amount}
//                                     onChange={handleNewItemChange}
//                                     className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
//                                 />
//                             </div>
                            
//                             {/* Discount (%) */}
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
//                                 <input
//                                     type="number"
//                                     name="discount"
//                                     min="0"
//                                     max="100"
//                                     step="1"
//                                     value={newItem.discount}
//                                     onChange={handleNewItemChange}
//                                     className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
//                                 />
//                             </div>

//                             {/* Add Button */}
//                             <button
//                                 type="button"
//                                 onClick={handleAddItem}
//                                 disabled={!selectedProduct || isSubmitting}
//                                 className="col-span-5 md:col-span-1 bg-green-600 hover:bg-green-700 text-white font-bold p-2.5 rounded-lg shadow-md transition-colors disabled:bg-gray-400 flex items-center justify-center"
//                             >
//                                 <Plus size={20} />
//                                 <span className="ml-1 hidden md:inline">Add</span>
//                             </button>
//                         </div>
//                     </div>
                    
//                     {/* 2. Invoice Items Table */}
//                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
//                         {invoiceItems.length === 0 ? (
//                             <div className="text-center py-6 text-gray-500">
//                                 No products added yet.
//                             </div>
//                         ) : (
//                             <table className="min-w-full divide-y divide-gray-200">
//                                 <thead className="bg-gray-50">
//                                     <tr>
//                                         {['Barcode', 'Product', 'Price (€)', 'Discount (%)', 'Amount', 'Total (€)', 'Actions'].map((header) => (
//                                             <th 
//                                                 key={header} 
//                                                 className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Actions' ? 'text-right' : ''}`}
//                                             >
//                                                 {header}
//                                             </th>
//                                         ))}
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                     {invoiceItems.map((item, index) => (
//                                         <tr key={index}>
//                                             <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.barcode}</td>
//                                             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{item.product}</td>
//                                             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.price.toFixed(2)}</td>
//                                             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.discount}%</td>
//                                             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.amount}</td>
//                                             <td className="px-4 py-3 whitespace-nowrap text-sm font-extrabold text-gray-900">{item.total.toFixed(2)}</td>
//                                             <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
//                                                 <button 
//                                                     type="button"
//                                                     onClick={() => handleDeleteItem(index)}
//                                                     className="text-red-600 hover:text-red-900 p-1"
//                                                     title="Delete Item"
//                                                 >
//                                                     Delete
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         )}
//                     </div>
//                 </div>

//                 {/* --- RIGHT SIDE: Client Info & Totals --- */}
//                 <div className="w-full lg:w-96 bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-6">
                    
//                     {/* 1. Client Selection */}
//                     <div className="pb-4 border-b">
//                         <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
//                         <select
//                             id="client-select"
//                             value={selectedClient?._id || ''}
//                             onChange={(e) => setSelectedClient(clients.find(c => c._id === e.target.value))}
//                             className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
//                         >
//                             <option value="">Select a client...</option>
//                             {clients.map((client) => (
//                                 <option key={client._id} value={client._id}>
//                                     {client.name}
//                                 </option>
//                             ))}
//                         </select>
                        
//                         {selectedClient && (
//                             <div className="mt-4 p-3 bg-gray-50 rounded-lg">
//                                 <p className="font-semibold text-gray-900">{selectedClient.name}</p>
//                                 <p className="text-sm text-gray-600">Contact: {selectedClient.contactName}</p>
//                                 <p className="text-sm text-gray-600">Phone: {selectedClient.phone}</p>
//                             </div>
//                         )}
//                     </div>

//                     {/* 2. Notes */}
//                     <div>
//                         <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note:</label>
//                         <textarea
//                             id="note"
//                             rows="3"
//                             value={note}
//                             onChange={(e) => setNote(e.target.value)}
//                             className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
//                             placeholder="Add any specific notes for this invoice..."
//                         />
//                     </div>

//                     {/* 3. Totals Summary */}
//                     <div className="pt-4 border-t space-y-2">
//                         <div className="flex justify-between font-medium text-gray-700">
//                             <span>Total Without VAT ({`${(vatRate * 100).toFixed(0)}%`})</span>
//                             <span>{subtotal.toFixed(2)}€</span>
//                         </div>
//                         <div className="flex justify-between font-medium text-gray-700">
//                             <span>VAT Amount</span>
//                             <span>{vatAmount.toFixed(2)}€</span>
//                         </div>
//                         <div className="flex justify-between font-extrabold text-xl text-gray-900 border-t pt-2 mt-2">
//                             <span>Total</span>
//                             <span>{totalWithVAT.toFixed(2)}€</span>
//                         </div>
//                     </div>
                    
//                     {/* 4. Error & Submit */}
//                     {formError && (
//                         <div className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
//                             {formError}
//                         </div>
//                     )}

//                     <button
//                         type="submit"
//                         disabled={isSubmitting || invoiceItems.length === 0}
//                         className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:bg-gray-400 flex items-center justify-center"
//                     >
//                         {isSubmitting ? (
//                             <><Loader2 className="animate-spin mr-2" size={20} /> Saving...</>
//                         ) : (
//                             'Save Invoice'
//                         )}
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// };

// export default AddInvoice;