import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/ProductList';
import ClientList from './pages/ClientList';
import InvoiceList from './pages/InvoiceList'; 
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import LoginModal from './components/LoginModal'; 
import AccountPage from './pages/Account';
import Transactions from './pages/Transactions';


// Helper function to map path from name
const getPath = (name) => name.toLowerCase().replace(/\s/g, '');

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDetailsView, setIsDetailsView] = useState(false);
    const [activePage, setActivePage] = useState('Dashboard');
    const [isLoginOpen, setIsLoginOpen] = useState(false); 

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // Function to render the correct component based on activePage state
    const renderContent = () => {
        switch (activePage) {
            case 'Dashboard':
                return <Dashboard />;
            case 'Products':
                return <ProductList />;
            case 'Clients':
                return <ClientList />
            case 'Invoice':
                return <InvoiceList setIsDetailsView={setIsDetailsView} />
            case 'Account':
                return <AccountPage />
            case 'Transactions':
                return <Transactions />
            case 'Reports':
                return <Reports />
            case 'Settings':
                return <Settings />
            
            default:
                return <Dashboard />;
        }
    };

    return (
        <AuthProvider>
        <div className="flex min-h-screen bg-gray-50">

            {/* 1. Sidebar is hidden if we are in the details view */}
            {!isDetailsView && (
                <Sidebar
                    active={activePage}
                    isSidebarOpen={isSidebarOpen}
                    setActivePage={setActivePage}
                />
            )}

            <div className="flex flex-col flex-1 overflow-x-hidden">
                
                {/* 2. Header is also hidden if we are in the details view */}
                {!isDetailsView && (
                    <Header 
                        toggleSidebar={toggleSidebar} 
                        isSidebarOpen={isSidebarOpen}
                        setIsLoginOpen={setIsLoginOpen}
                        // ⭐️ PASSED FOR NAVIGATION
                        setActivePage={setActivePage} 
                    />
                )}
               
                <main className="flex-1 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
            <LoginModal 
                isOpen={isLoginOpen} 
                onClose={() => setIsLoginOpen(false)}
            />
        </AuthProvider>
    );
}

export default App;