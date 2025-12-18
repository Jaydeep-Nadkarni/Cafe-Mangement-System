import { useMemo } from 'react';
import { Group } from '@visx/group';
import { Circle } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { useChartTooltip } from './ChartTooltip';
import ChartTooltip from './ChartTooltip';

const POINT_COLOR = '#757575';
const POINT_HOVER_COLOR = '#424242';

export default function VixsScatter({ 
  data, 
  width, 
  height,
  xAccessor = d => d.x,
  yAccessor = d => d.y,
  sizeAccessor,
  colorAccessor,
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  tooltipContent,
  margin = { top: 40, right: 30, bottom: 60, left: 60 }
}) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, handleTooltip, hideTooltip } = useChartTooltip();

  const { points, xScale, yScale, sizeScale } = useMemo(() => {
    if (!data || data.length === 0) return {};

    const xValues = data.map(xAccessor);
    const yValues = data.map(yAccessor);
    const sizeValues = sizeAccessor ? data.map(sizeAccessor) : [];

    const xScale = scaleLinear({
      domain: [Math.min(...xValues) * 0.9, Math.max(...xValues) * 1.1],
      range: [margin.left, width - margin.right],
      nice: true,
    });

    const yScale = scaleLinear({
      domain: [Math.min(...yValues) * 0.9, Math.max(...yValues) * 1.1],
      range: [height - margin.bottom, margin.top],
      nice: true,
    });

    const sizeScale = sizeAccessor
      ? scaleLinear({
          domain: [Math.min(...sizeValues), Math.max(...sizeValues)],
          range: [3, 15],
        })
      : null;

    const points = data.map(d => ({
      x: xScale(xAccessor(d)),
      y: yScale(yAccessor(d)),
      size: sizeScale ? sizeScale(sizeAccessor(d)) : 5,
      color: colorAccessor ? colorAccessor(d) : POINT_COLOR,
      data: d,
    }));

    return { points, xScale, yScale, sizeScale };
  }, [data, width, height, margin, xAccessor, yAccessor, sizeAccessor, colorAccessor]);

  if (!points || points.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

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
          <GridColumns
            scale={xScale}
            height={height - margin.top - margin.bottom}
            top={margin.top}
            stroke="#e0e0e0"
            strokeDasharray="3,3"
          />

          {points.map((point, i) => (
            <Circle
              key={`scatter-point-${i}`}
              cx={point.x}
              cy={point.y}
              r={point.size}
              fill={point.color}
              fillOpacity={0.7}
              className="transition-all hover:opacity-100 cursor-pointer"
              onMouseMove={(e) => handleTooltip(e, point.data)}
              onMouseLeave={hideTooltip}
            />
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
              <div className="font-semibold mb-1">Data Point</div>
              <div className="text-xs space-y-0.5">
                <div>{xLabel}: {xAccessor(tooltipData).toFixed(2)}</div>
                <div>{yLabel}: {yAccessor(tooltipData).toFixed(2)}</div>
                {sizeAccessor && <div>Size: {sizeAccessor(tooltipData).toFixed(2)}</div>}
              </div>
            </div>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}
