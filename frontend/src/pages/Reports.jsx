// src/pages/Reports.jsx
import React, { useState } from 'react';

const DUMMY_REPORT_DATA = [
    { number: '5', date: '12/29/2022 7:34:33 PM', client: 'George Electronics', paid: false },
    { number: '4', date: '12/20/2022 9:00:00 AM', client: 'Coffee Frappe', paid: true },
    { number: '3', date: '12/15/2022 4:00:00 PM', client: 'Ma Belle', paid: false },
];

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState(DUMMY_REPORT_DATA);

  const handleFilter = () => {
    // In a real application, this would filter the list based on dates
    console.log('Filtering reports from', startDate, 'to', endDate);
    // For now, we'll just log and use the dummy data
    alert(`Filtering not implemented. Showing all ${filteredInvoices.length} records.`);
  };

  return (
    <div className="p-8 bg-gray-50 flex-1">
      <h2 className="text-3xl font-semibold text-gray-900 mb-6">Reports by date</h2>

      {/* Date Filter Bar */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center space-x-4 max-w-xl">
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="mm/dd/yyyy"
          className="p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
        />
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="mm/dd/yyyy"
          className="p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
        />
        <button
          onClick={handleFilter}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Filtered Invoice List */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Invoice Number', 'Date', 'Client Name', 'Paid'].map((header) => (
                <th 
                  key={header} 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              <th className="px-6 py-3"></th> {/* Action column */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.number}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{invoice.number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.client}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {invoice.paid ? 'Paid' : 'Not Paid'}
                  </span>
                </td>
                {/* Action Buttons: Print, Edit, Pay, Details */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button className="text-green-600 hover:text-green-900 bg-green-100 py-1 px-3 rounded-md">
                    🖨️ Print Invoice
                  </button>
                  <button className="text-blue-600 hover:text-blue-900 bg-blue-100 py-1 px-3 rounded-md">
                    ✏️ Edit Invoice
                  </button>
                  <button className="text-green-600 hover:text-green-900 bg-green-100 py-1 px-3 rounded-md">
                    💲 Pay
                  </button>
                  <button className="text-gray-600 hover:text-gray-900 bg-gray-100 py-1 px-3 rounded-md">
                    📄 Invoice Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;