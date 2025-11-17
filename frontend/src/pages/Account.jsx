// frontend/src/AccountPage.jsx
import React, { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import AccountsTable from '../components/AccountsTable';
import AddAccountForm from '../components/AddAccountForm';
import AccountDetailView from '../components/AccountDetailView'; 
import EditAccountForm from '../components/EditAccountForm';     
import { useAuth } from '../context/AuthContext'; 

// Assuming you have defined these icons (or use basic SVGs)
const WalletIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 18H3V6h18v12zm0-14H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5 14h14v2H5v-2zm0-4h14v2H5v-2z"/></svg>;
const BarChartIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h3v14h-3zM16.2 13h3v6h-3z"/></svg>;


const API_BASE_URL = 'http://localhost:5000/api/accounts';

const AccountPage = () => {
    // Get authentication state and token
    const { token } = useAuth(); 

    const [currentView, setCurrentView] = useState('table'); // 'table', 'add', 'view', 'edit'
    const [selectedAccount, setSelectedAccount] = useState(null); // Stores account for view/edit
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic (READ - GET ALL) ---
    const fetchAccounts = async () => {
        // REVISED: If token is missing, set an error and stop loading.
        if (!token) {
            setError("Authentication required to fetch accounts data. Please log in.");
            setLoading(false);
            return;
        }

      setLoading(true);
      setError(null);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, 
        };

      try {
        const response = await fetch(API_BASE_URL, { headers });
        
        if (!response.ok) {
            // Specific 401/403 check for unauthorized access
            if (response.status === 401 || response.status === 403) {
                throw new Error("Session expired or unauthorized. Please log in again.");
            }
            
            let errorData = {};
            try {
                errorData = await response.json();
            } catch (e) {
                // Ignore if response is not JSON
            }
            
            // Throw a general error including the HTTP status and server message
            throw new Error(errorData.message || `HTTP error! status: ${response.status}.`);
        }
        const result = await response.json();
        setAccounts(result.data); 
      } catch (err) {
            // UPDATED ERROR MESSAGE FORMAT: Matching Reports.jsx
        setError(`Failed to load accounts: ${err.message}. Check if the server is running.`);
        console.error("Fetching error:", err);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchAccounts();
    }, [token]); // Re-fetch when token changes

    // --- Handlers for view changes (unchanged) ---
    const handleAddAccountClick = () => setCurrentView('add');
    const handleBackToList = () => {
        setSelectedAccount(null); 
        setCurrentView('table');
        fetchAccounts(); 
    };

    const handleViewAccount = (account) => {
        setSelectedAccount(account);
        setCurrentView('view');
    };

    const handleEditAccount = (account) => {
        setSelectedAccount(account); 
        setCurrentView('edit');
    };

    const handleAccountUpdateSuccess = (updatedAccount) => {
        setAccounts(prevAccounts => 
            prevAccounts.map(acc => acc._id === updatedAccount._id ? updatedAccount : acc)
        );
        setSelectedAccount(updatedAccount); 
        setCurrentView('view'); 
        fetchAccounts(); 
    };


    // Calculate statistics from fetched data
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalAccounts = accounts.length;

    // Dynamically set page title
    const getPageTitle = () => {
        switch (currentView) {
            case 'add': return 'Add New Account';
            case 'edit': return 'Edit Account';
            case 'view': return selectedAccount ? `Account Details: ${selectedAccount.name}` : 'Account Details';
            default: return 'Accounts';
        }
    };

    // --- Conditional Rendering for Loading and Error (Matching Reports.jsx) ---
    if (loading) {
        return <div className="p-8 text-center text-blue-600">Loading accounts...</div>;
    }

    if (error) {
        // If an error exists, render the full-screen error message like Reports.jsx
        return <div className="p-8 text-center text-red-600 font-medium">Error: {error}</div>;
    }
    // --- End Conditional Rendering ---


    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            
            {/* Page Header and Add Button */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                
                {currentView === 'table' && (
                    <button
                        onClick={handleAddAccountClick}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-150"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add New Account
                    </button>
                )}
            </div>

            {/* Account Overview Cards (only show on table view) */}
            {currentView === 'table' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <StatsCard
                        title="Balance"
                        value={`$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={WalletIcon}
                        iconBgColor="text-teal-500"
                        valueColor="text-teal-600"
                    />
                    <StatsCard
                        title="Accounts"
                        value={totalAccounts.toString()}
                        icon={BarChartIcon}
                        iconBgColor="text-blue-500"
                        valueColor="text-gray-800"
                    />
                </div>
            )}

            {/* Conditional Rendering of the main content area */}
            {currentView === 'add' && (
                <AddAccountForm
                    onCancel={handleBackToList} 
                    refreshList={fetchAccounts} 
                />
            )}

            {currentView === 'view' && selectedAccount && (
                <AccountDetailView
                    account={selectedAccount}
                    onBack={handleBackToList}
                    onEdit={handleEditAccount} 
                />
            )}

            {currentView === 'edit' && selectedAccount && (
                <EditAccountForm
                    account={selectedAccount}
                    onCancel={() => setCurrentView('view')} 
                    onUpdateSuccess={handleAccountUpdateSuccess} 
                />
            )}

            {currentView === 'table' && (
                <>
                    {/* Loading and Error messages are now handled by the top-level return blocks */}
                    <AccountsTable 
                        accounts={accounts} 
                        refreshData={fetchAccounts} 
                        onView={handleViewAccount} 
                        onEdit={handleEditAccount} 
                    />
                </>
            )}
        </div>
    );
};

export default AccountPage;