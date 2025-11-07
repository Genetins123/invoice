import React, { useState, useEffect, useCallback } from 'react';

// --- Configuration ---
const API_URL = "http://localhost:5000/api/clients";

// --- Reusable Modal Component for Confirmation/Alerts ---
const CustomModal = ({ isOpen, title, message, onClose, onConfirm, type = 'alert' }) => {
    if (!isOpen) return null;

    const isConfirm = type === 'confirm';
    const borderColor = isConfirm ? 'border-yellow-500' : 'border-red-500';
    const textColor = isConfirm ? 'text-yellow-800' : 'text-red-800';

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-xl shadow-2xl max-w-sm w-full border-t-4 ${borderColor}`}>
                <div className="p-6">
                    <h3 className={`text-xl font-bold mb-2 ${textColor}`}>{title}</h3>
                    <p className="text-gray-700 mb-6">{message}</p>
                    <div className="flex justify-end space-x-3">
                        {isConfirm && (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition duration-150"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={onConfirm || onClose} // Use onConfirm for confirm type, otherwise use onClose
                            className={`px-4 py-2 rounded-lg font-semibold transition duration-150 ${isConfirm ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        >
                            {isConfirm ? 'Delete' : 'OK'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- End Modal Component ---


// ==========================================================
// Component A: AddClient Form (Moved into this file)
// ==========================================================
const AddClient = ({ goBack }) => {
    // Initial state setup
    const initialState = {
        name: '', email: '', address: '', phone: '', website: '', businessNumber: '',
    };
    const [formData, setFormData] = useState(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success' // 'success' or 'error'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Basic validation check
        if (!formData.name || !formData.email || !formData.businessNumber) {
            setModal({
                isOpen: true,
                title: 'Validation Error',
                message: "Please fill in Client Name, Email, and Business Number.",
                type: 'error'
            });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const savedClient = await response.json();

            setModal({
                isOpen: true,
                title: 'Success!',
                message: `Client "${savedClient.name}" added successfully.`,
                type: 'success'
            });

            // Clear the form after success
            setFormData(initialState);

        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Failed to Save Client',
                message: `Error: ${error.message || 'An unknown network error occurred. Ensure your backend server is running.'}`,
                type: 'error'
            });
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
                required={['name'].includes(name)} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
            />
        </div>
    );

    return (
        <div className="bg-gray-100 min-h-screen p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl mx-auto my-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Add New Client</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {renderInput('Client Name', 'name')}
                        {renderInput('Email Address', 'email', 'email')}
                        {renderInput('Business Number', 'businessNumber')}
                        {renderInput('Phone Number', 'phone', 'tel')}
                        {renderInput('Address', 'address')}
                        {renderInput('Website', 'website', 'url')} 
                    </div>

                    <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                        <button
                            type="button"
                            onClick={goBack}
                            className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors shadow-md"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors shadow-lg disabled:bg-indigo-400"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : 'Save Client'}
                        </button>
                    </div>
                </form>
            </div>
            {/* Modal for Success/Error Messages */}
            <CustomModal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onClose={closeModal}
                type={modal.type}
            />
        </div>
    );
};


// ==========================================================
// Component B: ClientList (Main Component)
// ==========================================================
const ClientList = () => {
    const [clients, setClients] = useState([]);
    const [view, setView] = useState('list'); // 'list', 'add', or 'edit'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, clientToDelete: null });
    const [messageModal, setMessageModal] = useState({ isOpen: false, title: '', message: '', type: 'alert' });

    // --- Data Fetching Logic (Read) ---
    const fetchClients = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch clients: ${response.statusText}`);
            }
            const data = await response.json();
            setClients(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch data on component mount
    useEffect(() => {
        fetchClients();
    }, [fetchClients]);


    // --- Delete Logic (Delete) ---

    // 1. Open the confirmation modal
    const handleDeleteClick = (client) => {
        setDeleteModal({ isOpen: true, clientToDelete: client });
    };

    // 2. Perform the deletion
    const confirmDelete = async () => {
        const client = deleteModal.clientToDelete;
        if (!client || !client._id) return;

        setDeleteModal({ isOpen: false, clientToDelete: null });
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/${client._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Failed to delete client: ${response.statusText}`);
            }

            // Remove the client from the local state immediately
            setClients(prev => prev.filter(c => c._id !== client._id));

            setMessageModal({
                isOpen: true,
                title: 'Deleted!',
                message: `${client.name} has been successfully deleted.`,
                type: 'alert'
            });

        } catch (err) {
            setMessageModal({
                isOpen: true,
                title: 'Deletion Failed',
                message: `Could not delete client: ${err.message}`,
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Placeholder for Edit (Update) - In a real app, this would navigate to the edit form
    const handleEditClick = (client) => {
        // Here you would likely set the view to 'edit' and pass the client data
        // setView('edit'); 
        setMessageModal({
            isOpen: true,
            title: 'Edit Feature',
            message: `Ready to edit client: ${client.name}. This feature needs a dedicated Edit form component.`,
            type: 'alert'
        });
    };
    
    // Function passed to AddClient to return to the list view after save
    const handleGoBack = () => {
        setView('list');
        // Re-fetch data to show the newly added client
        fetchClients(); 
    };

    // --- View Rendering ---

    if (view === 'add') {
        // Note: The goBack function now also triggers a data fetch
        return <AddClient goBack={handleGoBack} />;
    }
    
    if (isLoading && clients.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <p className="text-xl text-indigo-600">Loading clients...</p>
            </div>
        );
    }

    // Render the Client List view
    return (
        <div className="p-4 sm:p-8 bg-gray-50 flex-1 min-h-screen">
            <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto">
                <h2 className="text-3xl font-semibold text-gray-900">Client List</h2>
                
                {/* Button to switch state to 'add' */}
                <button 
                    onClick={() => setView('add')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
                >
                    {/* Inline SVG for plus icon */}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    <span>Add New Client</span>
                </button>
            </div>

            {error && (
                <div className="max-w-7xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert">
                    <p className="font-bold">Error fetching data</p>
                    <p>{error}</p>
                </div>
            )}

            <p className="text-gray-500 mb-6 max-w-7xl mx-auto">Showing {clients.length} clients</p>

            {/* Client Table Container */}
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-7xl mx-auto overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Name', 'Email', 'Address', 'Phone', 'Website', 'Business Number'].map((header) => (
                                <th 
                                    key={header} 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> 
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clients.map((client) => (
                            <tr key={client._id || client.name} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{client.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.address}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {client.website ? <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">{client.website}</a> : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.businessNumber}</td>
                                
                                {/* Action Buttons matching the soft, rounded design */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button 
                                        onClick={() => handleEditClick(client)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(client)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all duration-200 bg-red-100 text-red-700 hover:bg-red-200"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {clients.length === 0 && !isLoading && (
                    <div className="text-center py-10 text-gray-500">
                        No clients found. Click "Add New Client" to get started!
                    </div>
                )}
            </div>

            {/* Confirmation Modal for Deletion */}
            <CustomModal
                isOpen={deleteModal.isOpen}
                title="Confirm Deletion"
                message={`Are you sure you want to delete client: ${deleteModal.clientToDelete?.name}? This action cannot be undone.`}
                onClose={() => setDeleteModal({ isOpen: false, clientToDelete: null })}
                onConfirm={confirmDelete}
                type="confirm"
            />

            {/* General Message/Success Modal */}
            <CustomModal
                isOpen={messageModal.isOpen}
                title={messageModal.title}
                message={messageModal.message}
                onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
                type={messageModal.type}
            />

        </div>
    );
};

export default ClientList;
