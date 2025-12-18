import { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { useChartTooltip } from './ChartTooltip';
import ChartTooltip from './ChartTooltip';

const BAR_COLOR = '#9e9e9e';
const BAR_HOVER_COLOR = '#757575';

export default function VixsHistogram({ 
  data, 
  width, 
  height,
  valueAccessor = d => d,
  bins = 10,
  xLabel = 'Value',
  yLabel = 'Frequency',
  tooltipContent,
  margin = { top: 40, right: 30, bottom: 60, left: 60 }
}) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, handleTooltip, hideTooltip } = useChartTooltip();

  const { histogram, xScale, yScale } = useMemo(() => {
    if (!data || data.length === 0) return {};

    const values = data.map(valueAccessor).sort((a, b) => a - b);
    const minValue = values[0];
    const maxValue = values[values.length - 1];
    const binWidth = (maxValue - minValue) / bins;

    // Create histogram bins
    const histogram = Array.from({ length: bins }, (_, i) => {
      const binStart = minValue + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = values.filter(v => v >= binStart && (i === bins - 1 ? v <= binEnd : v < binEnd)).length;
      return {
        binStart,
        binEnd,
        binLabel: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
      };
    });

    const xScale = scaleBand({
      domain: histogram.map(h => h.binLabel),
      range: [margin.left, width - margin.right],
      padding: 0.1,
    });

    const yScale = scaleLinear({
      domain: [0, Math.max(...histogram.map(h => h.count))],
      range: [height - margin.bottom, margin.top],
      nice: true,
    });

    return { histogram, xScale, yScale };
  }, [data, width, height, bins, margin, valueAccessor]);

  if (!histogram || histogram.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  const barWidth = xScale.bandwidth();

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group>
          <GridRows
            scale={yScale}
            width={width - margin.left - margin.right}
            left={margin.left}
            stroke="#e0e0e0"
            strokeDasharray="3,3"
          />

          {histogram.map((bin, i) => {
            const barHeight = yScale(0) - yScale(bin.count);
            const barX = xScale(bin.binLabel);
            const barY = yScale(bin.count);

            return (
              <Bar
                key={`histogram-bar-${i}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={BAR_COLOR}
                className="transition-colors hover:fill-[#757575] cursor-pointer"
                onMouseMove={(e) => handleTooltip(e, bin)}
                onMouseLeave={hideTooltip}
              />
            );
          })}

          <AxisBottom
            top={height - margin.bottom}
            scale={xScale}
            stroke="#666"
            tickStroke="#666"
            tickLabelProps={() => ({
              fill: '#666',
              fontSize: 9,
              textAnchor: 'middle',
              angle: -45,
            })}
            label={xLabel}
            labelOffset={30}
          />
          <AxisLeft
            left={margin.left}
            scale={yScale}
            stroke="#666"
            tickStroke="#666"
            tickLabelProps={() => ({
              fill: '#666',
              fontSize: 11,
              textAnchor: 'end',
              dx: -5,
            })}
            label={yLabel}
            labelOffset={40}
          />
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <ChartTooltip left={tooltipLeft} top={tooltipTop} data={tooltipData}>
          {tooltipContent ? tooltipContent(tooltipData) : (
            <div>
              <div className="font-semibold mb-1">Range: {tooltipData.binLabel}</div>
              <div className="text-xs">Frequency: {tooltipData.count}</div>
            </div>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}
