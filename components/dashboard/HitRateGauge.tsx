"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface HitRateGaugeProps {
  hitRate: number // 0-100
  totalAds: number
  winners: number
}

export function HitRateGauge({ hitRate, totalAds, winners }: HitRateGaugeProps) {
  const getColor = (rate: number) => {
    if (rate >= 30) return '#22c55e' // green
    if (rate >= 20) return '#f59e0b' // yellow/amber
    return '#ef4444' // red
  }

  const getStatusText = (rate: number) => {
    if (rate >= 30) return 'Excelente'
    if (rate >= 20) return 'Mejorable'
    return 'Necesita trabajo'
  }

  const color = getColor(hitRate)

  const data = [
    { name: 'Hit Rate', value: hitRate },
    { name: 'Rest', value: 100 - hitRate },
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-4xl font-bold" style={{ color }}>
            {hitRate.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-lg font-semibold" style={{ color }}>
          {getStatusText(hitRate)}
        </p>
        <p className="text-sm text-muted-foreground">
          {winners} winners de {totalAds} ads analizados
        </p>
      </div>
      {hitRate < 20 && (
        <p className="mt-2 text-sm text-red-500 text-center max-w-xs">
          Estas disparando a ciegas. Revisa la libreria de aprendizajes.
        </p>
      )}
    </div>
  )
}
