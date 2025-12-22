import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Neutral color palette for bar chart
const CHART_COLOR = '#424242';

export default function VixsTreemap({ 
  data, 
  width, 
  height,
  idAccessor = d => d.id,
  parentAccessor = d => d.parent,
  valueAccessor = d => d.value,
  labelAccessor = d => d.name,
  tooltipContent,
  margin = { top: 10, right: 10, bottom: 10, left: 10 }
}) {
  const chartData = useMemo(() => {
    try {
      if (!data || data.length === 0) return null;

      // Filter out nodes with zero or no value
      const validData = data
        .filter(d => {
          const val = valueAccessor(d);
          const id = idAccessor(d);
          return val && val > 0 && id;
        })
        .map(d => ({
          name: labelAccessor(d),
          value: Number(valueAccessor(d)) || 0,
          id: String(idAccessor(d))
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Show top 10 items

      return validData.length > 0 ? validData : null;
    } catch (error) {
      console.error('VixsTreemap error during data processing:', error);
      return null;
    }
  }, [data, idAccessor, parentAccessor, valueAccessor, labelAccessor]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip 
          formatter={(value) => value.toLocaleString()}
          labelFormatter={(label) => `${label}`}
        />
        <Bar dataKey="value" fill={CHART_COLOR} />
      </BarChart>
    </ResponsiveContainer>
  );
}
