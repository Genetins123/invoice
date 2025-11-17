import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LockClosedIcon, UserIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';

// Accepts setActivePage prop
const Header = ({ toggleSidebar, isSidebarOpen, setIsLoginOpen, setActivePage }) => {
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const { user, logout } = useAuth(); 

    const handleLogout = () => {
        // 1. Terminate session
        logout();
        
        // 2. Reset active page to Dashboard
        setActivePage('Dashboard'); 
        
        setIsDropdownOpen(false); 
        console.log('User logged out and navigated to Dashboard.');
    };

    const handleProfileClick = () => {
        // 1. Navigate to the Settings page
        setActivePage('Settings'); 
        
        setIsDropdownOpen(false); // Close dropdown
        console.log('Navigating to Settings component...');
    }

    const getInitial = () => {
        return user?.username?.[0]?.toUpperCase() ?? '?';
    };

    // Effect to handle clicks outside the dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="flex items-center justify-between p-4 bg-white shadow-md sticky top-0 z-10 h-16">
            {/* Sidebar Toggle and Title */}
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
                {/* Notification and Messages */}
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors" aria-label="Notifications">🔔</button>
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">0</span>
                    </div>

                    <div className="relative">
                        <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors" aria-label="Messages">✉️</button>
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-gray-400 rounded-full">0</span>
                    </div>
                </div>
                
                {user ? (
                    <div className="relative" ref={dropdownRef}> 
                        <div 
                            className="flex items-center space-x-2 p-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors" 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                        >
                            <img 
                                className="w-8 h-8 rounded-full object-cover bg-indigo-500 text-white flex items-center justify-center font-bold" 
                                src={`https://placehold.co/150x150/4f46e5/ffffff?text=${getInitial()}`} 
                                alt={`${user.username || 'Guest'} Avatar`}
                            />
                            <span className="text-gray-700 font-medium hidden md:block">
                                {user.username || 'Guest'}
                            </span>
                            <svg className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                        
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 border border-gray-100">
                                {/* PROFILE BUTTON */}
                                <button 
                                    onClick={handleProfileClick}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                >
                                    <UserIcon className="h-5 w-5 mr-2" />
                                    Profile
                                </button>
                                
                                <hr className="border-gray-100" /> 

                                {/* LOGOUT BUTTON */}
                                <button 
                                    onClick={handleLogout} 
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <ArrowLeftEndOnRectangleIcon className="h-5 w-5 mr-2" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
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