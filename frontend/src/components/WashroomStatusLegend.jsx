import React from 'react';
import WashroomStatusBadge from './WashroomStatusBadge';

const WashroomStatusLegend = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-dark-900/30 rounded-xl border border-white/5 mb-6">
      <span className="text-sm font-medium text-gray-400">Status Legend:</span>
      <WashroomStatusBadge status="available" />
      <WashroomStatusBadge status="occupied" />
      <WashroomStatusBadge status="cleaning" />
      <WashroomStatusBadge status="maintenance" />
    </div>
  );
};

export default WashroomStatusLegend;
