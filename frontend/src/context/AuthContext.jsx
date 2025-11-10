import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    // ⭐️ CORE FUNCTION: Updates user data both locally and on the server
    const updateUser = async (newUserData) => {
        
        // 1. Pre-flight check: ensure user and ID are available
        if (!user || !user._id) {
            // Throw error if ID is missing (causes the red message in Settings.js)
            throw new Error("User ID not available. Please log in again.");
        }
        
        // Use the unprotected /api/user/:id endpoint (MUST match backend router)
        const url = `http://localhost:5000/api/user/${user._id}`;
        
        try {
            // 2. Execute the PUT request
            const response = await fetch(url, { 
                method: 'PUT', // Hits router.put('/:id', userController.updateUser)
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization header is intentionally removed to match the unprotected backend
                },
                body: JSON.stringify(newUserData),
            });

            if (!response.ok) {
                let errorData = {};
                try {
                    // Try to get structured error data if server sent JSON (e.g., "User not found")
                    errorData = await response.json();
                } catch (e) {
                    // Fallback for non-JSON error (e.g., the 404/500 plain text error)
                    throw new Error(`Profile update failed. Server status: ${response.status}.`);
                }
                // Throw the error message from the server
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