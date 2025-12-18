import { useTooltip, TooltipWithBounds } from '@visx/tooltip';
import { localPoint } from '@visx/event';

export function useChartTooltip() {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();

  const handleTooltip = (event, data) => {
    const coords = localPoint(event.target.ownerSVGElement, event);
    showTooltip({
      tooltipLeft: coords?.x || 0,
      tooltipTop: coords?.y || 0,
      tooltipData: data,
    });
  };

  return {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    handleTooltip,
    hideTooltip,
  };
}

export default function ChartTooltip({ left, top, data, children }) {
  if (!data) return null;

  return (
    <TooltipWithBounds
      left={left}
      top={top}
      className="absolute bg-white shadow-lg rounded-lg border border-gray-200 p-3 text-sm"
      style={{
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {children}
    </TooltipWithBounds>
  );
}
