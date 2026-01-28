"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TrendDataPoint {
  period: string
  hitRate: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        No hay suficientes datos para mostrar tendencias.
      </div>
    )
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="period"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            domain={[0, 100]}
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Hit Rate']}
          />
          <Line
            type="monotone"
            dataKey="hitRate"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
