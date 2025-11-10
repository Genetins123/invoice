import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LockClosedIcon } from '@heroicons/react/24/outline'; // Icon import

const Header = ({ toggleSidebar, isSidebarOpen, setIsLoginOpen }) => {
    // Get user and logout function from context
    const { user, logout } = useAuth(); 

    // Handle logout action
    const handleLogout = () => {
        logout();
        console.log('User logged out successfully.');
    };

    // Helper function to safely get the first initial or a fallback
    const getInitial = () => {
        // Use optional chaining (?.) to safely access properties.
        // If user or username is missing, the expression evaluates to undefined.
        // Nullish coalescing (??) provides the fallback initial '?' if the result is undefined.
        return user?.username?.[0]?.toUpperCase() ?? '?';
    };

    return (
        <header className="flex items-center justify-between p-4 bg-white shadow-md sticky top-0 z-10 h-16">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
                    aria-label="Toggle Sidebar"
                >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">Invoice Management System</h1>
            </div>
            
            <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors" aria-label="Notifications">🔔</button>
                
                {/* Conditional Display based on user object */}
                {user ? (
                    // User is logged in: Show Avatar, Username, and Logout button
                    <div className="flex items-center space-x-2 cursor-pointer group relative">
                        {/* User Avatar - FIX APPLIED HERE */}
                        <img 
                            className="w-8 h-8 rounded-full object-cover bg-indigo-500 text-white flex items-center justify-center font-bold" 
                            // ⭐️ FIX: Use the safe helper function to get the initial
                            src={`https://placehold.co/150x150/4f46e5/ffffff?text=${getInitial()}`} 
                            alt={`${user.username || 'Guest'} Avatar`} // Added a fallback for alt text as well
                        />
                        {/* Display Username */}
                        <span className="text-gray-700 font-medium hidden md:block">
                            {/* Added a fallback for username display */}
                            {user.username || 'Guest'}
                        </span>
                        
                        {/* Simple Logout Button on hover */}
                        <button 
                            onClick={handleLogout} // Calls the contextual logout
                            className="absolute top-full right-0 p-2 bg-red-500 text-white text-sm rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-150 z-20 whitespace-nowrap"
                        >
                            Logout
                        </button>

                    </div>
                ) : (
                    // User is logged out: Show "Sign In" button that opens the modal
                    <button
                        onClick={() => setIsLoginOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition duration-150"
                    >
                        <LockClosedIcon className="h-5 w-5 mr-1" />
                        <span>Sign In</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;