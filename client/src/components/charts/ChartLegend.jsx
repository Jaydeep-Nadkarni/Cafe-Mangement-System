import { LegendOrdinal } from '@visx/legend';
import { scaleOrdinal } from '@visx/scale';

export default function ChartLegend({ data, colorScale, className = '' }) {
  const legendScale = scaleOrdinal({
    domain: data,
    range: colorScale.range(),
  });

  return (
    <div className={`flex justify-center items-center mt-4 ${className}`}>
      <LegendOrdinal scale={legendScale} direction="row" labelMargin="0 15px 0 0">
        {labels => (
          <div className="flex flex-wrap gap-4 justify-center">
            {labels.map((label, i) => (
              <div key={`legend-${i}`} className="flex items-center gap-2">
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: label.value,
                    borderRadius: 2,
                  }}
                />
                <span className="text-sm text-gray-700">{label.text}</span>
              </div>
            ))}
          </div>
        )}
      </LegendOrdinal>
    </div>
  );
}
