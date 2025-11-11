import React from 'react';
// Added BanknotesIcon for the Payments link
import { ChartPieIcon, ArchiveBoxIcon, UserGroupIcon,ArrowsRightLeftIcon, ReceiptPercentIcon, DocumentTextIcon, Cog6ToothIcon, BanknotesIcon } from '@heroicons/react/24/outline';

// Added 'Payments' item
const navItems = [
    { name: 'Dashboard', icon: ChartPieIcon },
    { name: 'Invoice', icon: ReceiptPercentIcon },
    { name: 'Clients', icon: UserGroupIcon },
    { name: 'Products', icon: ArchiveBoxIcon },
    { name: 'Account', icon: BanknotesIcon }, // <-- New Navigation Item
    { name: 'Transactions', icon: ArrowsRightLeftIcon }, // <-- New Navigation Item

    { name: 'Reports', icon: DocumentTextIcon },
    { name: 'Settings', icon: Cog6ToothIcon },
];

const Sidebar = ({ active, isSidebarOpen, setActivePage }) => {
    return (
        <div
            // Applying your new dark theme and width logic
            className={`flex flex-col bg-gray-800 text-white transition-all duration-300 ease-in-out h-screen fixed md:sticky top-0 z-20 ${isSidebarOpen ? 'w-64' : 'w-20'} overflow-hidden`}
            style={{ minHeight: '100vh' }}
        >
            <div className="p-4 text-xl font-bold bg-gray-900 flex items-center justify-center h-16">
                {/* Show full text only when open */}
                <span className={`${!isSidebarOpen && 'hidden'}`}>InvoiceApp</span>
                {/* Show short text only when collapsed */}
                <span className={`text-xl ${isSidebarOpen && 'hidden'}`}>I.A</span>
            </div>

            <nav className="flex-1 p-3 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => setActivePage(item.name)}
                        className={`
                            flex items-center w-full p-3 rounded-lg transition-colors duration-200 group
                            ${active === item.name
                                ? 'bg-indigo-600 shadow-lg text-white' // Active: Indigo background, white text
                                : 'hover:bg-gray-700 text-gray-300 hover:text-white' // Inactive: Darker hover, light gray text
                            }
                        `}
                    >
                        {/* Rendering the Heroicon component directly */}
                        <item.icon className={`w-6 h-6 mr-3 flex-shrink-0 ${active === item.name ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />

                        {/* Hide text label when collapsed */}
                        <span className={`whitespace-nowrap font-medium ${!isSidebarOpen && 'hidden'}`}>
                            {item.name}
                        </span>

                        {/* Show tooltip text if sidebar is collapsed (Re-added from original logic for usability) */}
                        {!isSidebarOpen && (
                            <span className="absolute left-full ml-4 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-150 z-40 whitespace-nowrap">
                                {item.name}
                            </span>
                        )}

                    </button>
                ))}
            </nav>

            {/* Version Number Div */}
            <div className={`p-4 text-sm text-gray-400 border-t border-gray-700 ${!isSidebarOpen && 'hidden'}`}>
                <p>v1.0</p>
            </div>
        </div>
    );
};

export default Sidebar;