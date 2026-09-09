'use client';

import { LineChart, Line } from 'recharts';

type Props = {
  data: { month: string; total: number }[];
  color: string;
};

export function MiniSparkline({ data, color }: Props) {
  return (
    <LineChart width={72} height={28} data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
      <Line
        type="monotone"
        dataKey="total"
        stroke={color}
        strokeWidth={1.5}
        dot={false}
        activeDot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}
