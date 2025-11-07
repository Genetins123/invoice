import React from 'react';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
    return (
        <header className="flex items-center justify-between p-4 bg-white shadow-md sticky top-0 z-10 h-16">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
                >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">Invoice Management System</h1>
            </div>
            <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-600 hover:text-indigo-600 transition-colors">🔔</button>
                <div className="flex items-center space-x-2 cursor-pointer">
                    <img className="w-8 h-8 rounded-full object-cover" src="https://placehold.co/150x150/4f46e5/ffffff?text=U" alt="User Avatar" />
                    <span className="text-gray-700 font-medium hidden md:block">User Admin</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
