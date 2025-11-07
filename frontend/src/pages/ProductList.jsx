import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit2, Save, X, Plus } from 'lucide-react'; // Using Lucide for icons

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
    return p / (1 + v / 100);
};

// --- SUB-COMPONENT: Confirmation Modal (Replaces window.confirm) ---

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
                <h3 className="text-lg font-bold text-red-600 mb-3">{title}</h3>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg"
                    >
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: AddProduct (Replaces the external import) ---

const AddProduct = ({ goBack, onSave, setStatusMessage }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        vatPercent: '',
        barcode: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const price = parseFloat(formData.price);
        const vat = parseFloat(formData.vatPercent);
        
        // Validation
        if (!formData.name || !formData.barcode || isNaN(price) || price <= 0 || isNaN(vat) || vat < 0) {
            setStatusMessage({ type: 'error', text: "Please ensure all fields are valid. Price and VAT must be positive numbers." });
            return;
        }

        const productPayload = {
            name: formData.name,
            price: price, 
            vat: vat, // Assuming the backend endpoint expects 'vat' field
            barcode: formData.barcode,
        };
        
        setIsSaving(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productPayload),
            });

            if (!response.ok) {
                let errorBody = await response.json();
                const detailedMessage = errorBody.message || 'Unknown Server Error';
                throw new Error(`HTTP error! Status: ${response.status}. Details: ${detailedMessage}`);
            }

            const newProduct = await response.json(); 
            onSave(newProduct);
            setStatusMessage({ type: 'success', text: `${newProduct.name} added successfully!` });
            
        } catch (err) {
            console.error("Error creating product:", err);
            setStatusMessage({ type: 'error', text: `Failed to add product. ${err.message}` });
        } finally {
            setIsSaving(false);
        }
    };
    
    // Form rendering
    return (
        <div className="p-8 bg-gray-50 flex-1 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-3xl font-semibold text-gray-900">Add New Product</h2>
                    <button 
                        onClick={goBack} 
                        className="text-gray-500 hover:text-indigo-600 transition-colors"
                        title="Go back to list"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <label className="block">
                        <span className="text-gray-700 font-medium">Product Name</span>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="e.g., Premium Web Hosting"
                        />
                    </label>

                    {/* Barcode */}
                    <label className="block">
                        <span className="text-gray-700 font-medium">Barcode (Unique Identifier)</span>
                        <input 
                            type="text" 
                            name="barcode" 
                            value={formData.barcode}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="e.g., 871987546321"
                        />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Price */}
                        <label className="block">
                            <span className="text-gray-700 font-medium">Price (VAT Included) - €</span>
                            <input 
                                type="number" 
                                name="price" 
                                value={formData.price}
                                onChange={handleChange}
                                required
                                min="0.01"
                                step="0.01"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </label>

                        {/* VAT % */}
                        <label className="block">
                            <span className="text-gray-700 font-medium">VAT Percentage (%)</span>
                            <input 
                                type="number" 
                                name="vatPercent" 
                                value={formData.vatPercent}
                                onChange={handleChange}
                                required
                                min="0"
                                max="100"
                                step="1"
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`px-6 py-3 text-lg font-bold rounded-lg shadow-lg transition-colors flex items-center ${
                                isSaving 
                                    ? 'bg-indigo-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-[1.01]'
                            }`}
                        >
                            {isSaving ? 'Saving...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT: ProductManagement (Renamed to App) ---

export default function App() {
    const [products, setProducts] = useState([]); 
    const [view, setView] = useState('list'); 
    const [editingId, setEditingId] = useState(null); 
    const [editFormData, setEditFormData] = useState({});
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Status message for successful/failed actions (replaces browser alerts)
    const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error', text: '...' }
    
    // State for confirmation modal (replaces window.confirm)
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        productId: null,
        productName: '',
    });
    
    // Clear status message after a delay
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => setStatusMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);


    // --- Data Fetching Logic (GET) ---
    const fetchProductsCallback = useCallback(async () => {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch products. Status: ${response.status}`);
        }
        return await response.json();
    }, []);

    const fetchProducts = useFetchWithBackoff(fetchProductsCallback);

    const loadProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchProducts();
            setProducts(data);
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Could not load products. Please ensure the backend server is running.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []); 

    // --- CRUD Handlers ---

    // Handles state update after successful POST (Add) or PUT (Edit)
    const handleSaveOrUpdate = (savedProduct) => {
        const existingIndex = products.findIndex(p => p._id === savedProduct._id);
        
        if (existingIndex !== -1) {
            // Update existing product
            const updatedProducts = [...products];
            updatedProducts[existingIndex] = savedProduct;
            setProducts(updatedProducts);
        } else {
            // Add new product
            setProducts(prevProducts => [...prevProducts, savedProduct]);
        }
        
        // Clear inline editing state
        setEditingId(null);
        setEditFormData({});
        // Reset view to the list (in case it came from 'add')
        setView('list');
    };
    
    // 1. Initiate Deletion (Show Modal)
    const handleDeleteStart = (productId, productName) => {
        setConfirmation({
            isOpen: true,
            productId: productId,
            productName: productName,
        });
    };

    // 2. Confirmed Deletion (API Call)
    const handleDeleteConfirm = useFetchWithBackoff(useCallback(async () => {
        const { productId, productName } = confirmation;
        setConfirmation({ ...confirmation, isOpen: false }); // Close modal immediately
        
        try {
            const response = await fetch(`${API_URL}/${productId}`, { method: 'DELETE' });
            
            if (!response.ok) {
                let errorBody = await response.json();
                const detailedMessage = errorBody.message || 'Unknown Server Error';
                throw new Error(`Failed to delete product. Status: ${response.status}. Details: ${detailedMessage}`);
            }
            
            setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
            setStatusMessage({ type: 'success', text: `${productName} deleted successfully.` });

        } catch (err) {
            console.error("Delete Error:", err);
            setStatusMessage({ type: 'error', text: `Failed to delete product: ${err.message}` });
        }
    }, [confirmation]));
    
    const handleDeleteCancel = () => {
        setConfirmation({ isOpen: false, productId: null, productName: '' });
    };

    // --- INLINE EDITING LOGIC ---

    const handleEditStart = (product) => {
        setEditingId(product._id);
        // Initialize form data with current product values
        setEditFormData({
            ...product,
            // Ensure numbers are strings for controlled inputs
            price: product.price.toString(),
            vatPercent: product.vatPercent.toString(),
        });
    };

    const handleCancelInline = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleInlineChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveInlineCallback = useCallback(async (e) => {
        e.preventDefault();
        
        // Use a temporary state derived from the current editFormData
        const tempFormData = { ...editFormData };

        // Basic validation for price/vat
        const price = parseFloat(tempFormData.price);
        const vat = parseFloat(tempFormData.vatPercent);

        if (!tempFormData.name || isNaN(price) || price <= 0 || isNaN(vat) || vat < 0) {
            setStatusMessage({ type: 'error', text: "Invalid data. Please check Name, Price, and VAT fields." });
            return;
        }

        const productPayload = {
            name: tempFormData.name,
            price: price, 
            vat: vat, // Sent to backend, mapped to vatPercent
        };

        const url = `${API_URL}/${editingId}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productPayload),
            });

            if (!response.ok) {
                let errorBody = await response.json();
                const detailedMessage = errorBody.message || 'Unknown Server Error';
                throw new Error(`HTTP error! Status: ${response.status}. Details: ${detailedMessage}`);
            }

            const updatedProduct = await response.json(); 
            handleSaveOrUpdate(updatedProduct); // Update local state
            setStatusMessage({ type: 'success', text: "Product updated successfully!" });

        } catch (err) {
            console.error("Error updating product inline:", err);
            setStatusMessage({ type: 'error', text: `Failed to update product. ${err.message}` });
            // Keep editing mode active on failure so user can fix data
        }
    }, [editingId, editFormData, handleSaveOrUpdate]);

    const handleSaveInline = useFetchWithBackoff(handleSaveInlineCallback);

    // --- Component Rendering ---
    
    if (view === 'add') {
        return (
            <AddProduct 
                goBack={() => setView('list')} 
                onSave={handleSaveOrUpdate} 
                setStatusMessage={setStatusMessage}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="p-8 flex-1 flex justify-center items-center min-h-screen">
                <p className="text-xl font-semibold text-indigo-600 animate-pulse">Loading products...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 flex-1 min-h-screen">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                    <button onClick={loadProducts} className="mt-2 text-sm font-semibold underline hover:text-red-900 transition-colors">
                        Try Reloading
                    </button>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="p-8 bg-gray-50 flex-1 min-h-screen">
            
            {/* Status Message Display */}
            {statusMessage && (
                <div 
                    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl transition-all duration-300 transform ${
                        statusMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}
                >
                    <p className="font-bold">{statusMessage.type === 'success' ? 'Success!' : 'Error!'}</p>
                    <p className="text-sm">{statusMessage.text}</p>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                title="Confirm Deletion"
                message={`Are you sure you want to permanently delete the product: "${confirmation.productName}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Product Inventory ({products.length})</h2>
                
                <button 
                    onClick={() => setView('add')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all flex items-center transform hover:scale-[1.03] active:scale-95"
                >
                    <Plus size={20} className="mr-2" />
                    Add New Product
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-3xl overflow-x-auto border border-gray-100">
                {/* Form wrapper for 'Save' on Enter keypress (only relevant when an input is focused) */}
                <form onSubmit={handleSaveInline}> 
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 rounded-t-lg">
                            <tr>
                                {['Name', 'Barcode', 'Price (Incl. VAT)', 'Price (Excl. VAT)', 'VAT (%)'].map((header) => (
                                    <th 
                                        key={header} 
                                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-base italic">
                                        No products in inventory. Use the "Add New Product" button to begin.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const isEditing = product._id === editingId;
                                    // Fallback to product if editFormData hasn't been initialized yet
                                    const currentData = isEditing ? editFormData : product; 

                                    // Ensure we calculate using the temporary form data if editing
                                    const displayPrice = isEditing ? parseFloat(currentData.price) : product.price;
                                    const displayVat = isEditing ? parseFloat(currentData.vatPercent) : product.vatPercent;
                                    
                                    const priceExclVat = calculatePriceWithoutVat(displayPrice, displayVat);

                                    return (
                                        <tr key={product._id} className={`transition duration-150 ${isEditing ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'hover:bg-gray-50'}`}>
                                            
                                            {/* Column 1: Name */}
                                            <td className="px-6 py-3 font-medium text-gray-900 w-1/4">
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        name="name" 
                                                        value={currentData.name || ''}
                                                        onChange={handleInlineChange}
                                                        className="w-full border-gray-300 rounded-lg shadow-sm text-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                                                        required
                                                    />
                                                ) : (
                                                    <span className="truncate block max-w-[200px]">{currentData.name}</span>
                                                )}
                                            </td>
                                            
                                            {/* Column 2: Barcode (Read-only) */}
                                            <td className="px-6 py-3 text-sm text-gray-500 font-mono w-1/6">{currentData.barcode}</td>

                                            {/* Column 3: Price (Editable) */}
                                            <td className="px-6 py-3 text-sm text-gray-700 font-semibold w-1/6">
                                                {isEditing ? (
                                                    <input 
                                                        type="number" 
                                                        name="price" 
                                                        value={currentData.price || ''}
                                                        onChange={handleInlineChange}
                                                        min="0.01"
                                                        step="0.01"
                                                        className="w-full border-gray-300 rounded-lg shadow-sm text-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                                                        required
                                                    />
                                                ) : (
                                                    `€ ${displayPrice ? displayPrice.toFixed(2) : '0.00'}`
                                                )}
                                            </td>

                                            {/* Column 4: Price Without VAT (Calculated/Display) */}
                                            <td className="px-6 py-3 text-sm text-gray-500 w-1/6">
                                                € {priceExclVat.toFixed(2)}
                                            </td>
                                            
                                            {/* Column 5: VAT % (Editable) */}
                                            <td className="px-6 py-3 text-sm text-gray-500 w-1/12">
                                                {isEditing ? (
                                                    <input 
                                                        type="number" 
                                                        name="vatPercent" 
                                                        value={currentData.vatPercent || ''}
                                                        onChange={handleInlineChange}
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        className="w-full border-gray-300 rounded-lg shadow-sm text-sm p-2 text-center focus:border-indigo-500 focus:ring-indigo-500"
                                                        required
                                                    />
                                                ) : (
                                                    `${displayVat ? displayVat.toFixed(0) : '0'} %`
                                                )}
                                            </td>
                                            
                                            {/* Column 6: Action Buttons */}
                                            <td className="px-6 py-3 text-center text-sm font-medium space-x-2 w-1/6">
                                                {isEditing ? (
                                                    <div className="flex justify-center space-x-2">
                                                        <button 
                                                            type="submit"
                                                            className="text-white bg-green-500 hover:bg-green-600 py-2 px-3 rounded-lg text-xs transition-colors font-semibold shadow-md flex items-center"
                                                        >
                                                            <Save size={14} className="mr-1" /> Save
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={handleCancelInline}
                                                            className="text-gray-600 bg-gray-200 hover:bg-gray-300 py-2 px-3 rounded-lg text-xs transition-colors font-semibold shadow-md flex items-center"
                                                        >
                                                            <X size={14} className="mr-1" /> Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center space-x-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleEditStart(product)}
                                                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-100 py-2 px-3 rounded-lg text-xs transition-colors font-semibold shadow-md flex items-center"
                                                        >
                                                            <Edit2 size={14} className="mr-1" /> Edit
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDeleteStart(product._id, product.name)}
                                                            className="text-red-600 hover:text-red-800 bg-red-100 py-2 px-3 rounded-lg text-xs transition-colors font-semibold shadow-md flex items-center"
                                                        >
                                                            <Trash2 size={14} className="mr-1" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </form>
            </div>
        </div>
    );
};
