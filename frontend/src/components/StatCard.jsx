// src/components/StatCard.jsx
import React from 'react';

const StatCard = ({ title, value, unit, icon, color }) => {
  return (
    <div className={`flex items-center bg-white p-6 rounded-lg shadow-md border-l-4 ${color} w-full`}>
      <div className={`p-3 rounded-full mr-4 bg-opacity-20 ${color.replace('border-', 'bg-')}`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-800">
          {value}
          <span className="text-base font-normal ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
};

export default StatCard;