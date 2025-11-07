// src/pages/Dashboard.jsx
import React from 'react';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const statsData = [
    { title: 'Total Revenue', value: '0', unit: '€', icon: '💰', color: 'border-blue-500' },
    { title: 'Issued Invoices', value: '0', unit: 'Invoices', icon: '📄', color: 'border-green-500' },
    { title: 'Products', value: '0', unit: 'Products', icon: '📦', color: 'border-orange-500' },
    { title: 'Sold Products', value: '0', unit: 'of total sold', icon: '🛒', color: 'border-cyan-500' },
  ];

  const latestInvoices = [
    { number: '5', date: '12/29/2022 7:04:33 PM', client: 'George Electronics', paid: false },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex-1">
      <h2 className="text-3xl font-semibold text-gray-900 mb-6">Dashboard</h2>
      <p className="text-gray-500 mb-8">Whole data about your business in one page</p>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Latest Invoices Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Latest Invoices</h3>
        
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
              <th className="px-6 py-3"></th> {/* Actions column */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {latestInvoices.map((invoice) => (
              <tr key={invoice.number}>
                <td className="px-6 py-4 whitespace-nowrap">{invoice.number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{invoice.client}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {invoice.paid ? 'Paid' : 'Not Paid'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-green-600 hover:text-green-900 mr-4">Print Invoice</button>
                  <button className="text-blue-600 hover:text-blue-900">Invoice Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;