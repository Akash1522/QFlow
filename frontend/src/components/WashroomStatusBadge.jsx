import React from 'react';

const WashroomStatusBadge = ({ status }) => {
  let badgeClasses = '';
  let dotColor = '';
  let label = '';

  switch (status?.toLowerCase()) {
    case 'available':
      badgeClasses = 'bg-green-100 text-green-700 border-green-300';
      dotColor = 'bg-green-500';
      label = 'Available';
      break;
    case 'occupied':
      badgeClasses = 'bg-red-100 text-red-700 border-red-300';
      dotColor = 'bg-red-500';
      label = 'Occupied';
      break;
    case 'cleaning':
      badgeClasses = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      dotColor = 'bg-yellow-500';
      label = 'Cleaning';
      break;
    case 'maintenance':
      badgeClasses = 'bg-gray-100 text-gray-700 border-gray-300';
      dotColor = 'bg-gray-500';
      label = 'Maintenance';
      break;
    default:
      badgeClasses = 'bg-gray-100 text-gray-700 border-gray-300';
      dotColor = 'bg-gray-500';
      label = 'Unknown Status';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label}
    </span>
  );
};

export default WashroomStatusBadge;
