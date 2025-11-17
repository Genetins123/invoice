import React, { createContext, useState, useContext } from 'react';
// REMOVED: import { useNavigate } from 'react-router-dom'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    
    // REMOVED: const navigate = useNavigate(); 

    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            // Safely parse the stored user object
            return storedUser ? JSON.parse(storedUser) : null; 
        } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            return null;
        }
    });
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    const login = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        // Clear local storage and state
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        
        // REMOVED: navigate('/login'); 
        
        // **THIS IS THE CRITICAL PART OF THE FIX:** // Force a full page reload. This clears all local component state
        // and forces the app to re-check the empty token, which should 
        // trigger your route guard to redirect to the login page.
        window.location.reload(); 
    };

    // CORE FUNCTION: Updates user data both locally and on the server
    const updateUser = async (newUserData) => {
        
        // 1. Pre-flight check: ensure user and ID are available
        if (!user || !user._id) {
            throw new Error("User ID not available. Please log in again.");
        }
        
        // Use the unprotected /api/user/:id endpoint (MUST match backend router)
        const url = `http://localhost:5000/api/user/${user._id}`;
        
        try {
            // 2. Execute the PUT request
            const response = await fetch(url, { 
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUserData),
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`Profile update failed. Server status: ${response.status}.`);
                }
                throw new Error(errorData.message || "Failed to update profile on the server.");
            }

            // 3. Handle Successful Response 
            const contentType = response.headers.get("content-type");
            let userToStore;
            
            if (contentType && contentType.includes("application/json")) {
                const updatedResponse = await response.json();
                // We expect the backend to send back the updated user object
                userToStore = updatedResponse.user || updatedResponse;
            } else {
                // If backend sends success (e.g., 204) but no JSON, update locally
                userToStore = { ...user, ...newUserData };
            }

            // 4. Update local state and storage
            localStorage.setItem('user', JSON.stringify(userToStore));
            setUser(userToStore);
            
            return userToStore;

        } catch (error) {
            // Re-throw the error to be handled by the component
            throw error;
        }
    };

    const value = {
        user,
        token,
        login,
        logout,
        updateUser, // Added to context
        isAuthenticated: !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};