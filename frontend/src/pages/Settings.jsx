import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 

const Settings = () => {
  // Get user data and the updateUser function from context
  const { user, updateUser } = useAuth(); 

  // Local state for form inputs (username and email are required for update)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  
  // UI state management
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to initialize form data when the component loads or user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission (async for API call)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!formData.username || !formData.email) {
        setMessage('Username and Email cannot be empty.');
        return;
    }
    
    setIsLoading(true);
    
    try {
        // AWAIT the server update via the context function
        await updateUser(formData); 
        
        setMessage('Profile updated successfully! 🎉');
        setIsEditing(false); // Switch back to view mode
        
    } catch (error) {
        // Display the server error message (e.g., "Failed to update profile: User not found.")
        setMessage(`Failed to update profile: ${error.message || 'Server connection error.'}`);
        
    } finally {
        setIsLoading(false);
        // Clear message after a few seconds
        setTimeout(() => setMessage(''), 5000); 
    }
  };


  if (!user) {
    return (
        <div className="p-8 bg-gray-50 flex-1">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8">Settings</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center text-red-500">
                You must be logged in to view your settings.
            </div>
        </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 flex-1">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8">Settings</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Profile Details</h2>
        
        {/* Success/Error Message Display */}
        {message && (
            <div className={`p-3 mb-4 rounded-md text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
            </div>
        )}

        {/* Conditional Rendering: Edit Mode vs. View Mode */}
        {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div className="flex flex-col md:flex-row md:items-center p-3 border rounded-md">
                    <label htmlFor="username" className="w-32 text-gray-700 font-medium">Username:</label>
                    <input
                        id="username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="flex-1 border p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />
                </div>

                {/* Email Input */}
                <div className="flex flex-col md:flex-row md:items-center p-3 border rounded-md">
                    <label htmlFor="email" className="w-32 text-gray-700 font-medium">Email:</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="flex-1 border p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />
                </div>
                
                {/* NOTE: If you wish to update phone and password, add inputs here. */}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-2">
                    <button 
                        type="button" 
                        onClick={() => {
                            // Reset form data to current user state and exit editing
                            setIsEditing(false);
                            setMessage('');
                            if (user) setFormData({ username: user.username, email: user.email });
                        }} 
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition flex items-center disabled:bg-indigo-400"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </form>
        ) : (
            // View Mode
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-md">
                    <span className="text-gray-700">Username: </span>
                    <span className="font-semibold text-indigo-600">{user.username}</span> 
                </div>
                <div className="flex justify-between items-center p-3 border rounded-md">
                    <span className="text-gray-700">Email: </span>
                    <span className="font-semibold text-indigo-600">{user.email}</span> 
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={() => {
                            setIsEditing(true);
                            setMessage(''); // Clear any previous status message
                        }} 
                        className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Edit Details
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Settings;