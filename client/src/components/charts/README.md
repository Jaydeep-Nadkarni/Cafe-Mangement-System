# Chart Components

Reusable chart components built with Visx for advanced data visualizations.

## Installation

The required packages are already in `package.json`. Run:

```bash
npm install
```

## Components

### Wrapper Components

#### TimeRangeSelector
Dropdown selector for time ranges (15min, 1h, 6h, today, 7d, 30d).

```jsx
import { TimeRangeSelector } from '@/components/charts';

<TimeRangeSelector 
  value={timeRange} 
  onChange={setTimeRange} 
/>
```

#### ChartContainer
Responsive container with title, subtitle, and automatic dimension handling.

```jsx
import { ChartContainer } from '@/components/charts';

<ChartContainer 
  title="Revenue Analysis"
  subtitle="Last 7 days"
  minHeight={300}
>
  {({ width, height }) => (
    <YourChart width={width} height={height} />
  )}
</ChartContainer>
```

#### ExportButton
Export chart data to CSV or PNG.

```jsx
import { useRef } from 'react';
import { ExportButton } from '@/components/charts';

const chartRef = useRef(null);

<div ref={chartRef}>
  <YourChart />
</div>
<ExportButton 
  chartRef={chartRef}
  data={chartData}
  filename="revenue-chart"
  type="both" // 'csv', 'png', or 'both'
/>
```

### Chart Components

#### VixsHeatmap
Heatmap visualization for 2D data (e.g., table occupancy by day/hour).

```jsx
import { VixsHeatmap } from '@/components/charts';

const data = [
  { x: 'Mon', y: '9AM', value: 85 },
  { x: 'Mon', y: '10AM', value: 92 },
  { x: 'Tue', y: '9AM', value: 78 },
  // ...
];

<VixsHeatmap
  data={data}
  width={600}
  height={400}
  xAccessor={d => d.x}
  yAccessor={d => d.y}
  valueAccessor={d => d.value}
  xLabel="Day of Week"
  yLabel="Time of Day"
  tooltipContent={(d) => (
    <div>
      <div className="font-semibold">{d.bin}</div>
      <div>Occupancy: {d.count}%</div>
    </div>
  )}
/>
```

#### VixsTreemap
Hierarchical data visualization (e.g., revenue breakdown by category).

```jsx
import { VixsTreemap } from '@/components/charts';

const data = [
  { id: 'root', parent: null, value: 0, name: 'Total' },
  { id: 'beverages', parent: 'root', value: 5000, name: 'Beverages' },
  { id: 'food', parent: 'root', value: 8000, name: 'Food' },
  { id: 'coffee', parent: 'beverages', value: 3000, name: 'Coffee' },
  { id: 'tea', parent: 'beverages', value: 2000, name: 'Tea' },
];

<VixsTreemap
  data={data}
  width={600}
  height={400}
  idAccessor={d => d.id}
  parentAccessor={d => d.parent}
  valueAccessor={d => d.value}
  labelAccessor={d => d.name}
/>
```

#### VixsBoxPlot
Box-and-whisker plot for distribution analysis (e.g., order values by payment method).

```jsx
import { VixsBoxPlot } from '@/components/charts';

const data = [
  { category: 'Cash', values: [10, 15, 20, 25, 30, 35, 40] },
  { category: 'Card', values: [20, 25, 30, 35, 40, 45, 50] },
  { category: 'UPI', values: [15, 20, 25, 30, 35, 40, 45] },
];

<VixsBoxPlot
  data={data}
  width={600}
  height={400}
  categoryAccessor={d => d.category}
  valuesAccessor={d => d.values}
  xLabel="Payment Method"
  yLabel="Order Value (₹)"
/>
```

#### VixsScatter
Scatter plot for correlation analysis (e.g., table size vs. average order value).

```jsx
import { VixsScatter } from '@/components/charts';

const data = [
  { tableSize: 2, avgOrder: 500, orders: 10 },
  { tableSize: 4, avgOrder: 800, orders: 15 },
  { tableSize: 6, avgOrder: 1200, orders: 8 },
];

<VixsScatter
  data={data}
  width={600}
  height={400}
  xAccessor={d => d.tableSize}
  yAccessor={d => d.avgOrder}
  sizeAccessor={d => d.orders}
  xLabel="Table Size (seats)"
  yLabel="Average Order Value (₹)"
/>
```

#### VixsHistogram
Frequency distribution chart (e.g., order value distribution).

```jsx
import { VixsHistogram } from '@/components/charts';

const data = [120, 150, 200, 180, 220, 190, 250, 300, 280, 350];

<VixsHistogram
  data={data}
  width={600}
  height={400}
  valueAccessor={d => d}
  bins={10}
  xLabel="Order Value (₹)"
  yLabel="Number of Orders"
/>
```

## Complete Example

```jsx
import { useState, useRef } from 'react';
import { 
  ChartContainer, 
  TimeRangeSelector, 
  ExportButton,
  VixsHeatmap 
} from '@/components/charts';

export default function TableOccupancyChart() {
  const [timeRange, setTimeRange] = useState('today');
  const [data, setData] = useState([]);
  const chartRef = useRef(null);

  // Fetch data when timeRange changes
  useEffect(() => {
    fetchTableHeatmap(timeRange).then(setData);
  }, [timeRange]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        <ExportButton 
          chartRef={chartRef}
          data={data}
          filename="table-occupancy"
          type="both"
        />
      </div>
      
      <div ref={chartRef}>
        <ChartContainer
          title="Table Occupancy Heatmap"
          subtitle={`Data for ${timeRange}`}
          minHeight={400}
        >
          {({ width, height }) => (
            <VixsHeatmap
              data={data}
              width={width}
              height={height}
              xAccessor={d => d.hour}
              yAccessor={d => d.table}
              valueAccessor={d => d.occupancy}
              xLabel="Hour of Day"
              yLabel="Table Number"
            />
          )}
        </ChartContainer>
      </div>
    </div>
  );
}
```

## Mobile Responsiveness

All charts automatically adapt to screen size:
- Responsive width/height calculation
- Font sizes adjust based on available space
- Labels hide on small screens when necessary
- Touch-friendly hover interactions

## Styling

Charts use neutral gray colors by default. To customize:

```jsx
// In your component
const customColors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];

<VixsTreemap
  data={data}
  // ... other props
/>
```

Then modify the COLOR constants in the chart component files.

## Performance Tips

1. **Memoize data transformations**: Use `useMemo` for expensive calculations
2. **Limit data points on mobile**: Filter data based on screen size
3. **Debounce resize events**: Charts auto-handle this via ChartContainer
4. **Use appropriate bins**: For histograms, adjust bin count based on data size

## API Integration

```jsx
import axios from 'axios';

const fetchTableHeatmap = async (timeRange) => {
  const { data } = await axios.get(
    `/api/branch/analytics/table-heatmap?range=${timeRange}`
  );
  return data.heatmap;
};

const fetchRevenueByPayment = async (timeRange) => {
  const { data } = await axios.get(
    `/api/branch/analytics/revenue-by-payment?range=${timeRange}`
  );
  return data.breakdown;
};
```
