import React from 'react';

export default function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="h-80 relative">
        {children}
      </div>
    </div>
  );
}