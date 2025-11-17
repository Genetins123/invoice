import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Edit, Trash2, Plus } from 'lucide-react';
// import ClientForm from '../components/ClientForm';
import { useAuth } from '../context/AuthContext'; // NEW: Import Auth

// --- Configuration ---
const API_URL = "http://localhost:5000/api/clients";

// --- Reusable Modal Component for Confirmation/Alerts ---
const CustomModal = ({ isOpen, title, message, onClose, onConfirm, type = 'alert' }) => {
    if (!isOpen) return null;

    const isConfirm = type === 'confirm';
    // Changed 'error' type modal to be red, and 'confirm' to be yellow for distinct visual cues
    const isError = type === 'error' || type === 'auth_error'; 
    const borderColor = isConfirm ? 'border-yellow-500' : isError ? 'border-red-500' : 'border-indigo-500';
    const textColor = isConfirm ? 'text-yellow-800' : isError ? 'text-red-800' : 'text-indigo-800';
    const primaryButtonColor = isConfirm ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700';

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
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={isConfirm ? onConfirm : onClose}
                            className={`px-4 py-2 text-sm font-medium rounded-lg shadow-md transition-colors ${primaryButtonColor}`}
                        >
                            {isConfirm ? 'Confirm Delete' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ClientList = () => {
    const { token } = useAuth(); // Access the token for API calls
    const [view, setView] = useState('list');
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Used for initial fetch error
    const [editClientData, setEditClientData] = useState(null);

    // Modal state for success/error messages not related to initial fetch
    const [messageModal, setMessageModal] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        type: 'alert' 
    });

    // Modal state for deletion confirmation
    const [deleteModal, setDeleteModal] = useState({ 
        isOpen: false, 
        clientToDelete: null 
    });

    // --- CORE FUNCTION: Fetch Clients ---
    const fetchClients = useCallback(async () => {
        if (!token) {
            setError("Authentication required to fetch client data. Please log in.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        
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
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setClients(data);

        } catch (err) {
            setError(`Data loading failed: ${err.message}.`);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // --- Action Handlers ---

    const handleEditStart = (client) => {
        setEditClientData(client);
        setView('edit');
    };

    const handleGoBack = () => {
        setEditClientData(null);
        setView('list');
        fetchClients(); // Refresh data when returning to list
    };

    const handleDeleteStart = (client) => {
        setDeleteModal({ isOpen: true, clientToDelete: client });
    };

    const confirmDelete = async () => {
        const client = deleteModal.clientToDelete;
        if (!client || !token) {
             setDeleteModal({ isOpen: false, clientToDelete: null });
             // Show error message if token is missing at this stage
             setMessageModal({ 
                 isOpen: true, 
                 title: 'Authentication Error', 
                 message: "Session expired or unauthorized. Please log in again.", 
                 type: 'error' 
             });
            return;
        }

        setIsLoading(true);
        setDeleteModal({ isOpen: false, clientToDelete: null }); // Close confirmation modal
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // ADDED AUTHORIZATION HEADER
        };

        try {
            const response = await fetch(`${API_URL}/${client._id}`, { 
                method: 'DELETE',
                headers: headers 
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                    throw new Error("Session expired or unauthorized to delete. Please log in again.");
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete client (Status: ${response.status}).`);
            }

            // Success: Show success message and refresh list
            setMessageModal({ 
                isOpen: true, 
                title: 'Success', 
                message: `Client ${client.name} successfully deleted.`, 
                type: 'alert' 
            });
            fetchClients(); 

        } catch (err) {
            setMessageModal({ 
                isOpen: true, 
                title: 'Deletion Failed', 
                message: err.message, 
                type: 'error' 
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- RENDER SECTION ---

    if (view === 'add' || view === 'edit') {
        // Pass token to ClientForm so it can use the Authorization header for POST/PUT
        return (
            <ClientForm 
                onGoBack={handleGoBack} 
                initialData={editClientData} 
                token={token} // Pass token to the form
            />
        );
    }

    // NEW: Standardized Error/Loading Display for List View
    if (isLoading) {
        return <div className="p-8 text-center text-blue-600 font-medium">Loading clients...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600 font-medium">Error: {error}</div>;
    }

    return (
        <div className="p-8 bg-gray-50 flex-1">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Client List</h1>
                <button
                    onClick={() => setView('add')}
                    className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                >
                    <Plus size={20} className="mr-2" /> Add New Client
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-2xl overflow-x-auto border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Client Name', 'Email', 'Business Number', 'Phone', 'Actions'].map((header) => (
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
                        {clients.map((client) => (
                            <tr key={client._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                    {client.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {client.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {client.businessNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {client.phone}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button 
                                        onClick={() => handleEditStart(client)}
                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 py-2 px-3 rounded-lg text-xs transition-colors font-semibold shadow-sm flex items-center"
                                    >
                                        <Edit size={14} className="mr-1" /> Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteStart(client)}
                                        className="text-red-600 hover:text-red-900 bg-red-100 py-2 px-3 rounded-lg text-xs transition-colors font-semibold shadow-sm flex items-center"
                                    >
                                        <Trash2 size={14} className="mr-1" /> Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {clients.length === 0 && !isLoading && !error && (
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