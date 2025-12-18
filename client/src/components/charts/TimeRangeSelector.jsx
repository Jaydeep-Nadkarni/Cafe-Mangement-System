import { useState } from 'react';

const TIME_RANGES = [
  { value: '15min', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];

export default function TimeRangeSelector({ value = 'today', onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Time Range:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {TIME_RANGES.map(range => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
    </div>
  );
}
