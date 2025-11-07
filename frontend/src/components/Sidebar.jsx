import React from 'react';

const navItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Products', icon: '📦' },
    { name: 'Clients', icon: '👤' },
    { name: 'Invoice', icon: '🧾' },
    { name: 'Reports', icon: '📈' },
    { name: 'Settings', icon: '⚙️' },
];

const Sidebar = ({ active, isSidebarOpen, setActivePage }) => {
    // Determine the width based on the state and screen size
    const sidebarClass = isSidebarOpen 
        ? 'w-64' // Open state: wide on all screens
        : 'w-20 hidden sm:block'; // Collapsed state: narrow view on desktop/tablet, hidden on mobile

    return (
        <div 
            // ⭐️ Changed the width class logic here to ensure it's visible and behaves better
            className={`flex flex-col bg-gray-800 text-white transition-all duration-300 ease-in-out h-screen fixed md:sticky top-0 z-20 ${isSidebarOpen ? 'w-64' : 'w-20'} overflow-hidden`}
            style={{ minHeight: '100vh' }}
        >
            <div className="p-4 text-xl font-bold bg-gray-900 flex items-center justify-center h-16">
                {/* Show full text only when open */}
                <span className={`${!isSidebarOpen && 'hidden'}`}>InvoiceApp</span>
                {/* Show short text only when collapsed */}
                <span className={`text-xl ${isSidebarOpen && 'hidden'}`}>I.A</span>
            </div>
            <nav className="flex-1 p-3 space-y-2 ">
                {navItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => setActivePage(item.name)}
                        className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 
                            ${active === item.name ? 'bg-indigo-600 shadow-lg' : 'hover:bg-gray-700'}`}
                    >
                        <span className="text-xl mr-3">{item.icon}</span>
                        {/* Hide text label when collapsed */}
                        <span className={`whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>{item.name}</span>
                    </button>
                ))}
            </nav>
            <div className={`p-4 text-sm text-gray-400 border-t border-gray-700 ${!isSidebarOpen && 'hidden'}`}>
                <p>v1.0</p>
            </div>
        </div>
    );
};

export default Sidebar;
