import { useMemo } from 'react';
import { HeatmapRect } from '@visx/heatmap';
import { scaleLinear, scaleBand } from '@visx/scale';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { useChartTooltip } from './ChartTooltip';
import ChartTooltip from './ChartTooltip';

// Neutral color scale for heatmap
const COLOR_SCALE = ['#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242'];

export default function VixsHeatmap({ 
  data, 
  width, 
  height,
  xAccessor = d => d.x,
  yAccessor = d => d.y,
  valueAccessor = d => d.value,
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  tooltipContent,
  margin = { top: 40, right: 20, bottom: 60, left: 80 }
}) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, handleTooltip, hideTooltip } = useChartTooltip();

  const { bins, xScale, yScale, colorScale, maxValue } = useMemo(() => {
    if (!data || data.length === 0) return {};

    const xValues = [...new Set(data.map(xAccessor))];
    const yValues = [...new Set(data.map(yAccessor))];
    const values = data.map(valueAccessor);
    const max = Math.max(...values);

    const xScale = scaleBand({
      domain: xValues,
      range: [margin.left, width - margin.right],
      padding: 0.1,
    });

    const yScale = scaleBand({
      domain: yValues,
      range: [margin.top, height - margin.bottom],
      padding: 0.1,
    });

    const colorScale = scaleLinear({
      domain: [0, max],
      range: [COLOR_SCALE[0], COLOR_SCALE[COLOR_SCALE.length - 1]],
    });

    // Group data by y value (rows)
    const bins = yValues.map(yValue => ({
      bin: yValue,
      bins: xValues.map(xValue => {
        const dataPoint = data.find(
          d => xAccessor(d) === xValue && yAccessor(d) === yValue
        );
        return {
          bin: xValue,
          count: dataPoint ? valueAccessor(dataPoint) : 0,
          data: dataPoint,
        };
      }),
    }));

    return { bins, xScale, yScale, colorScale, maxValue: max };
  }, [data, width, height, margin, xAccessor, yAccessor, valueAccessor]);

  if (!bins || bins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  const binWidth = xScale.bandwidth();
  const binHeight = yScale.bandwidth();

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group>
          <HeatmapRect
            data={bins}
            xScale={d => xScale(d) ?? 0}
            yScale={d => yScale(d) ?? 0}
            colorScale={colorScale}
            binWidth={binWidth}
            binHeight={binHeight}
            gap={2}
          >
            {heatmap =>
              heatmap.map(bins =>
                bins.map(bin => (
                  <rect
                    key={`heatmap-rect-${bin.row}-${bin.column}`}
                    className="transition-opacity hover:opacity-80 cursor-pointer"
                    width={bin.width}
                    height={bin.height}
                    x={bin.x}
                    y={bin.y}
                    fill={bin.color}
                    onMouseMove={(e) => handleTooltip(e, bin.bin)}
                    onMouseLeave={hideTooltip}
                  />
                ))
              )
            }
          </HeatmapRect>

          {/* Axes */}
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
              <div className="font-semibold">{tooltipData.bin}</div>
              <div className="text-gray-600">Value: {tooltipData.count}</div>
            </div>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}
