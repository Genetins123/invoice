import React from 'react';

const Settings = () => {
  return (
    <div className="p-8 bg-gray-50 flex-1">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8">Settings</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Invoice Configuration</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 border rounded-md">
            <span className="text-gray-700">Default VAT Rate: </span>
            <span className="font-semibold text-indigo-600">18%</span>
          </div>
          <div className="flex justify-between items-center p-3 border rounded-md">
            <span className="text-gray-700">Currency: </span>
            <span className="font-semibold text-indigo-600">Euro (€)</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">You can manage application-wide configurations here.</p>
      </div>
    </div>
  );
};

export default Settings;
