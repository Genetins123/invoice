import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    
    // NOTE: Using localStorage as a simple storage solution for this environment.
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
    
    // NOTE: Replace this placeholder URL with your actual backend URL
    const API_URL = 'http://localhost:5000/api/user'; 

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
        
        // Force a full page reload to reset application state after logout
        window.location.reload(); 
    };

    // CORE FUNCTION: Updates user data using the protected /profile endpoint
    const updateUser = async (newUserData) => {
        
        // 1. Pre-flight check: ensure token is available
        if (!token) {
            throw new Error("Authentication token not available. Please log in.");
        }
        
        // ⭐️ IMPORTANT FIX: Use the protected /profile endpoint
        const url = `${API_URL}/profile`;
        
        try {
            // 2. Execute the PUT request with Authorization header
            const response = await fetch(url, { 
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json',
                    // 🔑 CRITICAL: Send the token to authenticate the request
                    'Authorization': `Bearer ${token}`, 
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