// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, FileText, Package, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'; 
// 1. IMPORT USEAUTH
import { useAuth } from '../context/AuthContext'; 
import Transactions from './Transactions';

// --- Configuration ---
const API_URL = 'http://localhost:5000/api';

// Placeholder for the missing StatCard component - replace with your actual component
const StatCard = ({ title, value, unit, icon, color }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg border-t-4 ${color}`}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      {/* Renders the passed Lucide icon component */}
      <div className="text-2xl font-bold text-gray-600">{typeof icon === 'string' ? icon : <div className="text-3xl">{icon}</div>}</div>
    </div>
    <div className="mt-1 text-3xl font-extrabold text-gray-900">
      {value} <span className="text-base font-medium text-gray-500">{unit}</span>
    </div>
  </div>
);

// We update Dashboard to accept the required navigation handlers as props,
const Dashboard = ({ 
    onDetailsView = (id) => console.log('Dashboard: Navigating to details for ID:', id), 
    onPrintInvoice = (invoice) => {
        // ... (Keep existing onPrintInvoice logic here) ...
        const printData = JSON.stringify(invoice);
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Invoice #${invoice.invoiceNumber || 'N/A'}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    /* Custom print styles to ensure clean layout */
                    @page { margin: 1cm; }
                    body { font-family: 'Inter', sans-serif; }
                    .invoice-document {
                        box-shadow: none !important;
                        margin: 0 auto;
                        padding: 2rem;
                        max-width: 800px;
                        min-height: 100vh;
                        background-color: white;
                    }
                    /* Hide anything that should not be printed */
                    .no-print { display: none; }
                </style>
            </head>
            <body>
                <div id="print-area"></div>
                <script>
                    const data = JSON.parse('${printData}');
                    const printArea = document.getElementById('print-area');
                    
                    // Generate minimal HTML for printing
                    printArea.innerHTML = \`
                        <div class="invoice-document">
                            <h1 class="text-3xl font-bold text-gray-900 border-b pb-4 mb-4">INVOICE #\${data.invoiceNumber}</h1>
                            
                            <div class="flex justify-between mb-8 text-sm">
                                <div>
                                    <p class="font-semibold text-gray-700">BILLING COMPANY</p>
                                    <p class="text-gray-600">UltimateKode Billing</p>
                                    <p class="text-gray-600">123 Tech Park, Chennai, India</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-semibold text-gray-700">BILLED TO</p>
                                    <p class="text-gray-900 font-bold">\${data.client?.name || 'Unknown Client'}</p>
                                    <p class="text-gray-600">\${data.client?.address || 'N/A'}</p>
                                </div>
                            </div>

                            <table class="min-w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr class="bg-gray-100">
                                        <th class="border border-gray-300 p-2 text-left text-xs uppercase">Item</th>
                                        <th class="border border-gray-300 p-2 text-right text-xs uppercase">Qty</th>
                                        <th class="border border-gray-300 p-2 text-right text-xs uppercase">Price (€)</th>
                                        <th class="border border-gray-300 p-2 text-right text-xs uppercase">Total (€)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${data.items.map(item => \`
                                        <tr>
                                            <td class="border border-gray-300 p-2">\${item.name}</td>
                                            <td class="border border-gray-300 p-2 text-right">\${item.quantity}</td>
                                            <td class="border border-gray-300 p-2 text-right">\${parseFloat(item.price).toFixed(2)}</td>
                                            <td class="border border-gray-300 p-2 text-right">\${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</td>
                                        </tr>
                                    \`).join('')}
                                </tbody>
                            </table>
                            
                            <div class="flex justify-end mt-6">
                                <div class="w-1/2 text-right">
                                    <p class="text-xl font-bold text-indigo-600 border-t-2 border-indigo-600 pt-2">
                                        TOTAL: \${parseFloat(data.total).toFixed(2)}€
                                    </p>
                                </div>
                            </div>
                            
                            <p class="text-xs text-gray-500 mt-8">*Note: Status is \${data.status}.</p>
                        </div>
                    \`;
                    
                    // Trigger the print dialog after content is loaded
                    setTimeout(() => {
                        window.print();
                        window.onafterprint = () => window.close();
                    }, 500); 
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
}) => {
    // 2. USE THE AUTH CONTEXT
    const { isAuthenticated, token } = useAuth(); 

  // --- State Management ---
  const [stats, setStats] = useState([]);
  const [latestInvoices, setLatestInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching Logic ---
  const fetchDashboardData = useCallback(async () => {
    // 3. GUARD THE FETCH: Exit if not authenticated
    if (!isAuthenticated) {
        // Clear local state immediately for a clean look if this runs before reload
        setStats([]); 
        setLatestInvoices([]);
        setLoading(false);
        return; // STOP the fetch if not authenticated
    }
    
    setLoading(true);
    setError(null);

    try {
        // Include the Authorization header with the token in the fetch request
        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

      // Fetch Invoices and Products concurrently
      const [invoicesResponse, productsResponse] = await Promise.all([
        fetch(`${API_URL}/invoices`, { headers: authHeaders }), // ADD HEADERS
        fetch(`${API_URL}/products`, { headers: authHeaders }), // ADD HEADERS
      ]);

      if (!invoicesResponse.ok || !productsResponse.ok) {
        // If backend responds with a 401/403 (unauthorized) and we have a token, 
        // there might be a token issue. We still show the error.
        throw new Error("Failed to fetch all required data from the backend. Check your token/permissions.");
      }

      const invoices = await invoicesResponse.json();
      const products = await productsResponse.json();
        // ... (rest of the calculation logic remains the same) ...
        
        // --- Calculation Logic ---
        const totalRevenue = invoices.reduce((acc, invoice) => {
            if (invoice.status === 'Paid') {
                return acc + (parseFloat(invoice.total) || 0);
            }
            return acc;
        }, 0);

        const pendingRevenue = invoices.reduce((acc, invoice) => {
            if (invoice.status !== 'Paid') {
                return acc + (parseFloat(invoice.total) || 0);
            }
            return acc;
        }, 0);

        const totalProducts = products.length;
        const totalInvoices = invoices.length;

        const sortedInvoices = invoices
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5); 

      // --- Update State ---
      setStats([
        { title: 'Total Revenue', value: totalRevenue.toFixed(2), unit: '€', icon: <DollarSign size={20} className="text-blue-500" />, color: 'border-blue-500' },
        { title: 'Issued Invoices', value: totalInvoices.toString(), unit: 'Invoices', icon: <FileText size={20} className="text-green-500" />, color: 'border-green-500' },
        { title: 'Products', value: totalProducts.toString(), unit: 'Products', icon: <Package size={20} className="text-orange-500" />, color: 'border-orange-500' },
        { title: 'Pending Revenue', value: pendingRevenue.toFixed(2), unit: '€', icon: <TrendingUp size={20} className="text-cyan-500" />, color: 'border-cyan-500' },
      ]);

      setLatestInvoices(sortedInvoices);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'An unknown error occurred. Ensure your backend is running.');
    } finally {
      setLoading(false);
    }
    // 4. Update Dependency Array
  }, [isAuthenticated, token]); 

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Render Logic ---
    // ... (Keep existing loading/error/return logic) ...
  if (loading) {
    return (
      <div className="p-8 text-center text-indigo-600 flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin mb-3 text-indigo-600" size={32} />
        Loading dashboard data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex-1 min-h-screen">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
          <AlertTriangle className="inline-block mr-2" size={20} />
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="mt-2 text-sm font-semibold underline hover:text-red-900 transition-colors">
            Try Reloading
          </button>
        </div>
      </div>
    );
  }
    // If authenticated is false and there's no error, we show the empty dashboard (because state was reset)
    // The main app router should already redirect away, but this provides a visual safety net.

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex-1">
      <h2 className="text-3xl font-semibold text-gray-900 mb-6">Dashboard</h2>
      <p className="text-gray-500 mb-8">Whole data about your business in one page</p>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Latest Invoices Section */}
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-3">Latest Invoices (Top 5)</h3>

        {latestInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">
            No recent invoices found.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (€)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {latestInvoices.map((invoice) => {
                const isPaid = invoice.status === 'Paid';
                const displayDate = new Date(invoice.date).toLocaleDateString();
                const statusClass = isPaid ? 'bg-green-100 text-green-800' :
                  invoice.status === 'Due' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

                return (
                  <tr key={invoice._id || invoice.invoiceNumber} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-600">#{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{displayDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">{invoice.client?.name || 'Unknown Client'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{parseFloat(invoice.total).toFixed(2)}€</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                        {invoice.status}
                      </span>
                    </td>
                  
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
<Transactions />
    </div>

  );
};

export default Dashboard;