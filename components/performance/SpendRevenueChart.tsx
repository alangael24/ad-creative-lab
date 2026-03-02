'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DailyData {
  date: string
  spend: number
  revenue: number
}

export function SpendRevenueChart({ data }: { data: DailyData[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No hay datos para mostrar.
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(v) => {
              const d = new Date(v + 'T00:00:00')
              return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
            }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value, name) => [
              `$${Number(value).toFixed(2)}`,
              name === 'spend' ? 'Gasto' : 'Revenue',
            ]}
            labelFormatter={(label) => {
              const d = new Date(label + 'T00:00:00')
              return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
            }}
          />
          <Legend formatter={(value) => (value === 'spend' ? 'Gasto' : 'Revenue')} />
          <Line
            type="monotone"
            dataKey="spend"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
