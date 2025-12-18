import { useMemo } from 'react';
import { Treemap, hierarchy, stratify } from '@visx/hierarchy';
import { scaleOrdinal } from '@visx/scale';
import { Group } from '@visx/group';
import { useChartTooltip } from './ChartTooltip';
import ChartTooltip from './ChartTooltip';

// Neutral color palette for treemap
const COLORS = ['#424242', '#616161', '#757575', '#9e9e9e', '#bdbdbd', '#e0e0e0', '#f5f5f5'];

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
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, handleTooltip, hideTooltip } = useChartTooltip();

  const { root, colorScale } = useMemo(() => {
    if (!data || data.length === 0) return {};

    // Add root node if not present
    const hasRoot = data.some(d => !parentAccessor(d));
    const treeData = hasRoot ? data : [
      { id: 'root', parent: null, value: 0, name: 'Root' },
      ...data
    ];

    const stratifiedData = stratify()
      .id(idAccessor)
      .parentId(parentAccessor)(treeData);

    const root = hierarchy(stratifiedData)
      .sum(d => valueAccessor(d.data) || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const colorScale = scaleOrdinal({
      domain: root.children?.map(c => c.data.id) || [],
      range: COLORS,
    });

    return { root, colorScale };
  }, [data, idAccessor, parentAccessor, valueAccessor]);

  if (!root) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group top={margin.top} left={margin.left}>
          <Treemap
            root={root}
            size={[innerWidth, innerHeight]}
            tile="squarify"
            paddingInner={2}
            paddingOuter={2}
            round
          >
            {treemap => (
              <Group>
                {treemap
                  .descendants()
                  .reverse()
                  .map((node, i) => {
                    const nodeWidth = node.x1 - node.x0;
                    const nodeHeight = node.y1 - node.y0;
                    
                    if (nodeWidth < 10 || nodeHeight < 10) return null; // Skip tiny nodes

                    return (
                      <Group key={`treemap-node-${i}`} top={node.y0} left={node.x0}>
                        <rect
                          width={nodeWidth}
                          height={nodeHeight}
                          fill={node.depth === 1 ? colorScale(node.data.id) : '#f5f5f5'}
                          stroke="#fff"
                          strokeWidth={2}
                          className="transition-opacity hover:opacity-80 cursor-pointer"
                          onMouseMove={(e) => handleTooltip(e, node.data.data)}
                          onMouseLeave={hideTooltip}
                        />
                        {nodeWidth > 40 && nodeHeight > 30 && (
                          <text
                            x={nodeWidth / 2}
                            y={nodeHeight / 2}
                            dy=".33em"
                            fontSize={Math.min(nodeWidth / 8, 14)}
                            textAnchor="middle"
                            fill="#fff"
                            fontWeight="600"
                            pointerEvents="none"
                          >
                            {labelAccessor(node.data.data)}
                          </text>
                        )}
                        {nodeWidth > 60 && nodeHeight > 50 && (
                          <text
                            x={nodeWidth / 2}
                            y={nodeHeight / 2 + 15}
                            dy=".33em"
                            fontSize={11}
                            textAnchor="middle"
                            fill="#fff"
                            pointerEvents="none"
                          >
                            {valueAccessor(node.data.data)}
                          </text>
                        )}
                      </Group>
                    );
                  })}
              </Group>
            )}
          </Treemap>
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <ChartTooltip left={tooltipLeft} top={tooltipTop} data={tooltipData}>
          {tooltipContent ? tooltipContent(tooltipData) : (
            <div>
              <div className="font-semibold">{labelAccessor(tooltipData)}</div>
              <div className="text-gray-600">Value: {valueAccessor(tooltipData)}</div>
            </div>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}
