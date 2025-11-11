// frontend/src/AccountPage.jsx
import React, { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import AccountsTable from '../components/AccountsTable';
import AddAccountForm from '../components/AddAccountForm';
import AccountDetailView from '../components/AccountDetailView'; // NEW IMPORT
import EditAccountForm from '../components/EditAccountForm';     // NEW IMPORT

// Assuming you have defined these icons (or use basic SVGs)
const WalletIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 18H3V6h18v12zm0-14H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM5 14h14v2H5v-2zm0-4h14v2H5v-2z"/></svg>;
const BarChartIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h3v14h-3zM16.2 13h3v6h-3z"/></svg>;


const API_BASE_URL = 'http://localhost:5000/api/accounts';

const AccountPage = () => {
  const [currentView, setCurrentView] = useState('table'); // 'table', 'add', 'view', 'edit'
  const [selectedAccount, setSelectedAccount] = useState(null); // Stores account for view/edit
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching Logic (READ - GET ALL) ---
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setAccounts(result.data); 
    } catch (err) {
      setError("Failed to fetch accounts. Check if the server is running on port 5000.");
      console.error("Fetching error:", err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []); // Run only once on component mount

  // --- Handlers for view changes ---
  const handleAddAccountClick = () => setCurrentView('add');
  const handleBackToList = () => {
      setSelectedAccount(null); // Clear selected account when going back to list
      setCurrentView('table');
      fetchAccounts(); // Refresh table data just in case
  };

  const handleViewAccount = (account) => {
      setSelectedAccount(account);
      setCurrentView('view');
  };

  const handleEditAccount = (account) => {
      setSelectedAccount(account); // Ensure the account object is passed to the edit form
      setCurrentView('edit');
  };

  // Callback for when an account is successfully updated
  const handleAccountUpdateSuccess = (updatedAccount) => {
      // Optimistically update the list without re-fetching all accounts
      setAccounts(prevAccounts => 
          prevAccounts.map(acc => acc._id === updatedAccount._id ? updatedAccount : acc)
      );
      setSelectedAccount(updatedAccount); // Update selected account in case we go back to detail view
      setCurrentView('view'); // Go back to detail view after editing
      fetchAccounts(); // A full refresh is safer for complex apps
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      
      {/* Page Header and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
        
        {/* Only show "Add New Account" button when viewing the table */}
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
          onCancel={handleBackToList} // Go back to table view
          refreshList={fetchAccounts} // Refresh list after successful add
        />
      )}

      {currentView === 'view' && selectedAccount && (
        <AccountDetailView
          account={selectedAccount}
          onBack={handleBackToList}
          onEdit={handleEditAccount} // Pass handler for edit button
        />
      )}

      {currentView === 'edit' && selectedAccount && (
        <EditAccountForm
          account={selectedAccount}
          onCancel={() => setCurrentView('view')} // Go back to detail view
          onUpdateSuccess={handleAccountUpdateSuccess} // Update table and go to view
        />
      )}

      {currentView === 'table' && (
        <>
          {loading && <p className="text-center text-blue-500">Loading accounts...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          
          {!loading && !error && (
            <AccountsTable 
              accounts={accounts} 
              refreshData={fetchAccounts} 
              onView={handleViewAccount} // Pass view handler
              onEdit={handleEditAccount} // Pass edit handler
            />
          )}
        </>
      )}
    </div>
  );
};

export default AccountPage;