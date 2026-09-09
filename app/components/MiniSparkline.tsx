'use client';

import { LineChart, Line, Tooltip } from 'recharts';

type Props = {
  data: { month: string; total: number }[];
  color: string;
};

export function MiniSparkline({ data, color }: Props) {
  return (
    <LineChart width={72} height={28} data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
      <Tooltip
        formatter={(value) => `$${Number(value).toFixed(2)}`}
        labelFormatter={(label) => label}
        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
      />
      <Line
        type="monotone"
        dataKey="total"
        stroke={color}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}
