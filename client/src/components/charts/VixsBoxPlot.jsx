import { useMemo } from 'react';
import { Group } from '@visx/group';
import { BoxPlot } from '@visx/stats';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { useChartTooltip } from './ChartTooltip';
import ChartTooltip from './ChartTooltip';

const BOX_COLOR = '#9e9e9e';
const MEDIAN_COLOR = '#424242';
const WHISKER_COLOR = '#757575';

export default function VixsBoxPlot({ 
  data, 
  width, 
  height,
  categoryAccessor = d => d.category,
  valuesAccessor = d => d.values,
  xLabel = 'Category',
  yLabel = 'Value',
  tooltipContent,
  margin = { top: 40, right: 30, bottom: 60, left: 60 }
}) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, handleTooltip, hideTooltip } = useChartTooltip();

  const { boxPlotData, xScale, yScale } = useMemo(() => {
    if (!data || data.length === 0) return {};

    const categories = data.map(categoryAccessor);
    const allValues = data.flatMap(valuesAccessor);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    const xScale = scaleBand({
      domain: categories,
      range: [margin.left, width - margin.right],
      padding: 0.3,
    });

    const yScale = scaleLinear({
      domain: [minValue * 0.9, maxValue * 1.1],
      range: [height - margin.bottom, margin.top],
      nice: true,
    });

    const boxPlotData = data.map(d => {
      const values = valuesAccessor(d).sort((a, b) => a - b);
      const min = values[0];
      const max = values[values.length - 1];
      const median = values[Math.floor(values.length / 2)];
      const q1 = values[Math.floor(values.length / 4)];
      const q3 = values[Math.floor((values.length * 3) / 4)];

      return {
        category: categoryAccessor(d),
        min,
        max,
        median,
        firstQuartile: q1,
        thirdQuartile: q3,
        outliers: [],
      };
    });

    return { boxPlotData, xScale, yScale };
  }, [data, width, height, margin, categoryAccessor, valuesAccessor]);

  if (!boxPlotData || boxPlotData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  const boxWidth = xScale.bandwidth();

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

          {boxPlotData.map((d, i) => (
            <Group 
              key={`boxplot-${i}`} 
              left={xScale(d.category)}
              onMouseMove={(e) => handleTooltip(e, d)}
              onMouseLeave={hideTooltip}
              className="cursor-pointer"
            >
              <BoxPlot
                min={d.min}
                max={d.max}
                left={boxWidth / 2}
                firstQuartile={d.firstQuartile}
                thirdQuartile={d.thirdQuartile}
                median={d.median}
                boxWidth={boxWidth * 0.6}
                fill={BOX_COLOR}
                fillOpacity={0.6}
                stroke={BOX_COLOR}
                strokeWidth={2}
                valueScale={yScale}
                minProps={{
                  stroke: WHISKER_COLOR,
                  strokeWidth: 2,
                }}
                maxProps={{
                  stroke: WHISKER_COLOR,
                  strokeWidth: 2,
                }}
                medianProps={{
                  stroke: MEDIAN_COLOR,
                  strokeWidth: 3,
                }}
                boxProps={{
                  className: 'transition-opacity hover:opacity-80',
                }}
              />
            </Group>
          ))}

          <AxisBottom
            top={height - margin.bottom}
            scale={xScale}
            stroke="#666"
            tickStroke="#666"
            tickLabelProps={() => ({
              fill: '#666',
              fontSize: 11,
              textAnchor: 'middle',
            })}
            label={xLabel}
            labelOffset={15}
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
              <div className="font-semibold mb-1">{tooltipData.category}</div>
              <div className="text-xs space-y-0.5">
                <div>Max: {tooltipData.max.toFixed(2)}</div>
                <div>Q3: {tooltipData.thirdQuartile.toFixed(2)}</div>
                <div className="font-medium">Median: {tooltipData.median.toFixed(2)}</div>
                <div>Q1: {tooltipData.firstQuartile.toFixed(2)}</div>
                <div>Min: {tooltipData.min.toFixed(2)}</div>
              </div>
            </div>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}
