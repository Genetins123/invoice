// src/components/StatsCard.jsx
import React from 'react';

const StatsCard = ({ title, value, icon: IconComponent, iconBgColor, valueColor }) => {
  return (
    <div className="flex items-center justify-between p-6 bg-white rounded-lg shadow-md border-t-4 border-l-4 border-gray-100 min-w-[300px]">
      <div className="flex flex-col">
        {/* Value: Large, Bold Text */}
        <p className={`text-4xl font-bold ${valueColor}`}>{value}</p>
        {/* Title: Small, Gray Text */}
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
      
      {/* Icon with colored circle background */}
      <div className={`p-3 rounded-full ${iconBgColor} bg-opacity-10 text-opacity-80`}>
        <IconComponent className={`w-8 h-8 ${iconBgColor} `} />
      </div>
    </div>
  );
};

export default StatsCard;