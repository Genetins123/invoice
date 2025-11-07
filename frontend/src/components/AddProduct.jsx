import React, { useState } from 'react';

// The function has been wrapped in a single file component.
const AddProduct = ({ goBack, onSave }) => {
  const [formData, setFormData] = useState({
    name: '', barcode: '', price: '', vat: '18', // Default VAT to 18
  });

  const [isLoading, setIsLoading] = useState(false);
  // Using an object for detailed status/error messages
  const [status, setStatus] = useState({ message: null, type: null }); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ message: null, type: null });
    
    // Basic validation
    if (!formData.name || !formData.price || !formData.barcode) {
      setStatus({ message: "Please fill in Product Name, Barcode, and Price.", type: 'error' });
      setIsLoading(false);
      return;
    }

    const price = parseFloat(formData.price);
    const vat = parseFloat(formData.vat || 0);

    const newProduct = {
      name: formData.name,
      barcode: formData.barcode,
      price: price, 
      vat: vat, 
    };
    
    console.log('Sending product data:', newProduct); 

    const API_URL = 'http://localhost:5000/api/products'; 
    
    try {
      const maxRetries = 3;
      let response = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProduct),
        });

        if (response.ok) {
          break; // Success
        }

        if (attempt < maxRetries - 1) {
          const delay = 2 ** attempt * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          let errorBody = null;
          try {
            errorBody = await response.json();
          } catch (e) {
            errorBody = { message: response.statusText || 'Unknown Server Error' };
          }

          const detailedMessage = errorBody.message || errorBody.error || 'No specific error message provided by server.';
          
          throw new Error(`HTTP error! Status: ${response.status}. Details: ${detailedMessage}`);
        }
      }

      const savedProduct = await response.json(); 
      
      // ⭐️ FIX: Check if onSave is a function before calling it
      if (typeof onSave === 'function') {
        onSave(savedProduct);
      } else {
        console.warn("Prop Warning: 'onSave' is missing or not a function. Product state will not be updated in the parent.");
      }
      
      setStatus({ message: "Product saved successfully!", type: 'success' });
      
      // ⭐️ FIX: Check if goBack is a function before calling it
      if (typeof goBack === 'function') {
        setTimeout(goBack, 1500); 
      } else {
        console.warn("Prop Warning: 'goBack' is missing or not a function.");
      }

    } catch (err) {
      console.error("Error saving product:", err);
      // Display the detailed error message in the UI
      setStatus({ message: `Failed to save product. ${err.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderInput = (label, name, type = 'text') => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? (name === 'vat' ? '1' : '0.01') : undefined}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
      />
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl mx-auto my-8 border border-gray-100">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">
        Add New Product
      </h2>
      
      {/* Dynamic Status/Error Message Display */}
      {status.message && (
        <div 
            className={`p-4 mb-4 rounded-lg text-sm ${status.type === 'success' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'}`} 
            role="alert"
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderInput('Product Name', 'name')}
          {renderInput('Barcode', 'barcode')}
          {renderInput('Price (Incl. VAT) €', 'price', 'number')}
          {renderInput('VAT (%)', 'vat', 'number')}
        </div>
        
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={goBack}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all duration-200 shadow-md"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-8 py-3 text-white font-bold rounded-lg transition-all duration-200 shadow-lg ${
              isLoading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
