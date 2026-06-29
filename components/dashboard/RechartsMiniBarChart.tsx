import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from 'recharts';

/**
 * Props for the RechartsMiniBarChart component.
 */
export interface RechartsMiniBarChartProps {
  /**
   * Array of data points for the bar chart. Each point must contain a numeric `value`.
   */
  data: { value: number }[];
  /**
   * The color to use for the bars. Should be a Tailwind or CSS color class string.
   */
  color: string;
  /**
   * Optional height of the chart container (e.g., '3rem'). Defaults to '3rem'.
   */
  height?: string;
  /**
   * Accessible label describing the chart for assistive technologies.
   */
  ariaLabel?: string;
}

/**
 * A lightweight, responsive mini bar chart using Recharts.
 *
 * It mirrors the visual footprint of the previous handcrafted chart while adding
 * tooltips, axes, and full keyboard/screen‑reader accessibility.
 */
export const RechartsMiniBarChart: React.FC<RechartsMiniBarChartProps> = ({
  data,
  color,
  height = '3rem',
  ariaLabel = 'Mini bar chart',
}) => {
  // Transform data to include a simple index label for XAxis (hidden).
  const transformedData = data.map((d, i) => ({ ...d, name: i.toString() }));

  return (
    <div
      className="flex items-end"
      style={{ height }}
      aria-label={ariaLabel}
      role="img"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={transformedData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" hide />
          <Tooltip
            cursor={false}
            contentStyle={{ background: 'var(--chart-tooltip-bg)', border: 'none' }}
            formatter={(value: number) => `${value}%`}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
