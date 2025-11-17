import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Edit, X, Save, Loader2, AlertTriangle } from 'lucide-react'; // Added icons
import { useAuth } from '../context/AuthContext'; // NEW: Import Auth

// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api/products';

// --- HELPER FUNCTIONS ---

// Function to simulate exponential backoff for API calls (robustness)
const useFetchWithBackoff = (callback) => {
    const maxRetries = 3;

    const execute = useCallback(async (...args) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await callback(...args);
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                // Wait for 2^i * 100ms before retrying
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
            }
        }
    }, [callback]);

    return execute;
}

// Helper function to calculate price without VAT for the frontend display
const calculatePriceWithoutVat = (price, vatPercent) => {
    const p = parseFloat(price);
    const v = parseFloat(parseFloat(vatPercent) || 0); // Handle null/undefined vatPercent gracefully
    if (isNaN(p) || p <= 0 || isNaN(v)) return 0;
    // Formula: Price_Excl_VAT = Price_Incl_VAT / (1 + VAT_Rate/100)
    return p / (1 + v / 100);
};

// --- SUB-COMPONENT: Confirmation Modal (Unchanged) ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border-t-4 border-yellow-500">
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-yellow-800">{title}</h3>
                    <p className="text-gray-700 mb-6">{message}</p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium rounded-lg shadow-md transition-colors bg-red-600 text-white hover:bg-red-700"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const ProductList = () => {
    const { token } = useAuth(); // Access the token for API calls
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list', 'add', 'edit'
    const [editingProduct, setEditingProduct] = useState(null); // The product being edited
    const [formData, setFormData] = useState({ 
        name: '', 
        barcode: '', 
        price: '', 
        vatPercent: '20' 
    });
    const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error', text: '' }
    const [isSaving, setIsSaving] = useState(false);
    const [confirmation, setConfirmation] = useState({ 
        isOpen: false, 
        productId: null, 
        productName: '' 
    });

    // --- CORE FUNCTION: Fetch Products ---
    const fetchProducts = useCallback(async () => {
        if (!token) {
            setStatusMessage({ type: 'error', text: "Authentication required to fetch products. Please log in." });
            setLoading(false);
            return;
        }

        setLoading(true);
        setStatusMessage(null); // Clear initial status message

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // ADDED AUTHORIZATION HEADER
        };

        try {
            const response = await fetch(API_URL, { headers });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                    throw new Error("Session expired or unauthorized. Please log in again.");
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setProducts(data);
            setStatusMessage(null); // Clear error on successful fetch

        } catch (err) {
            // Set the main fetch error here. This will be picked up by the early return logic.
            setStatusMessage({ type: 'error', text: `Data loading failed: ${err.message}.` });
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // --- FORM HANDLERS (Add/Edit) ---

    const handleChange = (e) => {
        setStatusMessage(null); // Clear message on change
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEditStart = (product) => {
        setEditingProduct(product);
        setFormData({ 
            name: product.name, 
            barcode: product.barcode, 
            price: product.price, // Assuming price is total price
            vatPercent: product.vatPercent ? String(product.vatPercent) : '20'
        });
        setView('edit');
    };

    const handleCancelEditAdd = () => {
        setEditingProduct(null);
        setFormData({ name: '', barcode: '', price: '', vatPercent: '20' });
        setStatusMessage(null);
        setView('list');
    };

    // 1. Save Product (Add/Edit)
    const handleSaveProduct = useFetchWithBackoff(useCallback(async (e) => {
        e.preventDefault();
        
        if (!token) {
            setStatusMessage({ type: 'error', text: "Authentication required to save product. Please log in." });
            return;
        }

        // ... (Validation logic remains the same) ...
        const price = parseFloat(formData.price);
        const vat = parseFloat(formData.vatPercent); 
        
        // Validation 
        if (!formData.name || !formData.barcode || isNaN(price) || price <= 0 || isNaN(vat) || vat < 0) {
            setStatusMessage({ type: 'error', text: "Please ensure all fields are valid. Price must be positive." });
            return;
        }
        
        const productPayload = { 
            name: formData.name, 
            price: price, // This is the total price (incl VAT)
            vat: vat, 
            barcode: formData.barcode,
            // Assuming the backend handles the Price_Excl_VAT calculation
        };

        setIsSaving(true);
        setStatusMessage(null);

        const method = editingProduct ? 'PUT' : 'POST';
        const endpoint = editingProduct ? `${API_URL}/${editingProduct._id}` : API_URL;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // ADDED AUTHORIZATION HEADER
        };

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: headers,
                body: JSON.stringify(productPayload),
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                    throw new Error("Session expired or unauthorized to save product. Please log in again.");
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save product (Status: ${response.status}).`);
            }

            // Success: 
            setStatusMessage({ type: 'success', text: `Product successfully ${editingProduct ? 'updated' : 'added'}!` });
            handleCancelEditAdd(); // Return to list view and clear form
            fetchProducts(); 
            
        } catch (err) {
            setStatusMessage({ type: 'error', text: `Product saving failed: ${err.message}.` });
        } finally {
            setIsSaving(false);
        }
    }, [editingProduct, formData.name, formData.barcode, formData.price, formData.vatPercent, fetchProducts, token]));

    // 2. Initiate Deletion (Show Modal)
    const handleDeleteStart = (productId, productName) => {
        setConfirmation({ isOpen: true, productId: productId, productName: productName, });
    };

    // 3. Confirmed Deletion (API Call)
    const handleDeleteConfirm = useFetchWithBackoff(useCallback(async () => {
        if (!token) {
            setConfirmation({ ...confirmation, isOpen: false });
            setStatusMessage({ type: 'error', text: "Authentication required to delete product. Please log in." });
            return;
        }

        const productId = confirmation.productId;
        setConfirmation({ ...confirmation, isOpen: false }); // Close modal first
        setIsSaving(true); // Reusing isSaving state for general operation status

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // ADDED AUTHORIZATION HEADER
        };

        try {
            const response = await fetch(`${API_URL}/${productId}`, {
                method: 'DELETE',
                headers: headers,
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                    throw new Error("Session expired or unauthorized to delete. Please log in again.");
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete product (Status: ${response.status}).`);
            }
            
            // Success: 
            setStatusMessage({ type: 'success', text: `Product ${confirmation.productName} successfully deleted.` });
            fetchProducts(); 
            
        } catch (err) {
            setStatusMessage({ type: 'error', text: `Product deletion failed: ${err.message}.` });
        } finally {
            setIsSaving(false);
        }
    }, [confirmation.productId, confirmation.productName, fetchProducts, token]));


    // --- RENDER SECTION ---

    // Conditional render for Add/Edit View
    if (view === 'add' || view === 'edit') {
        return (
            <div className="p-8 bg-gray-50 flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">{editingProduct ? 'Edit Product' : 'Add New Product'}</h1>
                <div className="max-w-xl bg-white p-6 rounded-xl shadow-2xl">
                    <form onSubmit={handleSaveProduct}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Form fields (Name, Barcode, Price, VAT) remain the same */}
                            <label className="block">
                                <span className="text-gray-700 font-medium">Product Name</span>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500" />
                            </label>
                            <label className="block">
                                <span className="text-gray-700 font-medium">Barcode / SKU</span>
                                <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500" />
                            </label>
                            <label className="block">
                                <span className="text-gray-700 font-medium">Price (Incl. VAT)</span>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0.01" step="0.01" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500" />
                            </label>
                            <label className="block">
                                <span className="text-gray-700 font-medium">VAT (%)</span>
                                <input type="number" name="vatPercent" value={formData.vatPercent} onChange={handleChange} required min="0" max="100" step="1" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500" />
                            </label>
                        </div>
                        
                        {/* Inline Status Message for form actions */}
                        {statusMessage && (
                            <div className={`mt-4 p-3 rounded-lg text-sm font-semibold flex items-center ${
                                statusMessage.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 
                                'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                                {statusMessage.type === 'error' ? <AlertTriangle size={18} className="mr-2" /> : null}
                                {statusMessage.text}
                            </div>
                        )}
                        
                        <div className="flex justify-end space-x-4 mt-6">
                            <button
                                type="button"
                                onClick={handleCancelEditAdd}
                                className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50"
                                disabled={isSaving}
                            >
                                <X size={20} className="mr-2" /> Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors disabled:bg-indigo-400"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                ) : (
                                    <Save size={20} className="mr-2" />
                                )}
                                {editingProduct ? 'Update Product' : 'Add Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
    
    // NEW: Standardized Error/Loading Display for List View
    // Only display if we are not in edit/add mode
    if (loading && view === 'list') {
        return <div className="p-8 text-center text-blue-600 font-medium">Loading products...</div>;
    }

    // Display error only if it's the main fetch error (statusMessage is set to error and we are in list view)
    if (statusMessage?.type === 'error' && view === 'list') {
        return <div className="p-8 text-center text-red-600 font-medium">Error: {statusMessage.text}</div>;
    }


    // --- List View Render ---
    return (
        <div className="p-8 bg-gray-50 flex-1">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Product List</h1>
                <button
                    onClick={() => setView('add')}
                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                    disabled={isSaving} // Disable if another operation is running
                >
                    <Plus size={20} className="mr-2" /> Add New Product
                </button>
            </div>

            {/* Success Message for Delete/Save actions in list view */}
            {statusMessage?.type === 'success' && (
                <div className="p-4 mb-4 rounded-lg text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
                    {statusMessage.text}
                </div>
            )}
            
            {/* Loading/Saving Indicator */}
            {isSaving && (
                 <div className="p-4 mb-4 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-200 flex items-center">
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Processing request...
                </div>
            )}

            <div className="bg-white rounded-xl shadow-2xl overflow-x-auto border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Product Name', 'Barcode', 'Price (Excl. VAT)', 'VAT (%)', 'Price (Incl. VAT)', 'Actions'].map((header) => (
                                <th 
                                    key={header} 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    No products found. Click "Add New Product" to get started!
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => {
                                const priceExclVat = calculatePriceWithoutVat(product.price, product.vat);
                                return (
                                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.barcode}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            € {priceExclVat.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.vat}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                            € {parseFloat(product.price).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleEditStart(product)}
                                                    className="text-indigo-600 hover:text-indigo-800 bg-indigo-100 py-2 px-3 rounded-lg text-xs transition-colors font-semibold shadow-md flex items-center"
                                                >
                                                    <Edit size={14} className="mr-1" /> Edit
                                                </button>
                                                
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDeleteStart(product._id, product.name)}
                                                    className="text-red-600 hover:text-red-800 bg-red-100 py-2 px-3 rounded-lg text-xs transition-colors font-semibold shadow-md flex items-center"
                                                >
                                                    <Trash2 size={14} className="mr-1" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                title="Confirm Deletion"
                message={`Are you sure you want to delete product: ${confirmation.productName}? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
            />
        </div>
    );
};

export default ProductList;