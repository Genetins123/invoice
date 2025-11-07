// import React, { useState } from 'react';

// // --- Configuration ---
// const API_URL = "http://localhost:5000/api/clients";

// // --- Reusable Modal Component (for alerts/messages) ---
// const CustomModal = ({ isOpen, title, message, onClose, type = 'success' }) => {
//     if (!isOpen) return null;

//     const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';
//     const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
//     const buttonBg = type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white';

//     return (
//         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className={`bg-white rounded-xl shadow-2xl max-w-sm w-full border-t-4 ${borderColor}`}>
//                 <div className="p-6">
//                     <h3 className={`text-xl font-bold mb-2 ${textColor}`}>{title}</h3>
//                     <p className="text-gray-700 mb-4">{message}</p>
//                     <div className="flex justify-end">
//                         <button
//                             onClick={onClose}
//                             className={`px-4 py-2 rounded-lg font-semibold transition duration-150 ${buttonBg} hover:opacity-90`}
//                         >
//                             OK
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };
// // --- End Modal Component ---


// const AddClient = ({ goBack }) => {
//     // Initial state setup
//     const initialState = {
//         name: '', email: '', address: '', phone: '', website: '', businessNumber: '',
//     };
//     const [formData, setFormData] = useState(initialState);
//     const [isLoading, setIsLoading] = useState(false);
//     const [modal, setModal] = useState({
//         isOpen: false,
//         title: '',
//         message: '',
//         type: 'success' // 'success' or 'error'
//     });

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({ ...prev, [name]: value }));
//     };

//     const closeModal = () => {
//         setModal(prev => ({ ...prev, isOpen: false }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);

//         // Basic validation check
//         if (!formData.name || !formData.email || !formData.businessNumber) {
//             setModal({
//                 isOpen: true,
//                 title: 'Validation Error',
//                 message: "Please fill in Client Name, Email, and Business Number.",
//                 type: 'error'
//             });
//             setIsLoading(false);
//             return;
//         }

//         try {
//             const response = await fetch(API_URL, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(formData),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
//             }

//             const savedClient = await response.json();

//             setModal({
//                 isOpen: true,
//                 title: 'Success!',
//                 message: `Client "${savedClient.name}" added successfully.`,
//                 type: 'success'
//             });

//             // Optionally go back or clear the form
//             setFormData(initialState);
//             // If you want to go back to the previous screen immediately after success: goBack();

//         } catch (error) {
//             setModal({
//                 isOpen: true,
//                 title: 'Failed to Save Client',
//                 message: `Error: ${error.message || 'An unknown network error occurred. Ensure your backend server is running.'}`,
//                 type: 'error'
//             });
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const renderInput = (label, name, type = 'text') => (
//         <div className="mb-4">
//             <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
//                 {label}
//             </label>
//             <input
//                 type={type}
//                 id={name}
//                 name={name}
//                 value={formData[name]}
//                 onChange={handleChange}
//                 // Check against the Mongoose schema requirements
//                 required={['name'].includes(name)} 
//                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
//             />
//         </div>
//     );

//     return (
//         <div className="bg-gray-100 min-h-screen p-4">
//             <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto my-8">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Add New Client</h2>
//                 <form onSubmit={handleSubmit}>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
//                         {/* Renamed from 'web' to 'website' to match Mongoose schema */}
//                         {renderInput('Client Name', 'name')}
//                         {renderInput('Email Address', 'email', 'email')}
//                         {renderInput('Business Number', 'businessNumber')}
//                         {renderInput('Phone Number', 'phone', 'tel')}
//                         {renderInput('Address', 'address')}
//                         {renderInput('Website', 'website', 'url')} 
//                     </div>

//                     <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
//                         <button
//                             type="button"
//                             onClick={goBack}
//                             className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors shadow-md"
//                             disabled={isLoading}
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="submit"
//                             className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-lg disabled:bg-indigo-400"
//                             disabled={isLoading}
//                         >
//                             {isLoading ? 'Saving...' : 'Save Client'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//             {/* Modal for Success/Error Messages */}
//             <CustomModal
//                 isOpen={modal.isOpen}
//                 title={modal.title}
//                 message={modal.message}
//                 onClose={closeModal}
//                 type={modal.type}
//             />
//         </div>
//     );
// };

// // Export the component as default (typical React structure)
// export default AddClient;
