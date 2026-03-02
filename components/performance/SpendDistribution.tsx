'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { ANGLES, FORMATS } from '@/lib/constants'

interface DistItem {
  label: string
  spend: number
  revenue: number
  count: number
}

interface SpendDistributionProps {
  byFormat: { format: string; spend: number; revenue: number; count: number }[]
  byAngle: { angleType: string; spend: number; revenue: number; count: number }[]
  byAvatar: { avatarName: string; spend: number; revenue: number; count: number }[]
}

type Tab = 'format' | 'angle' | 'avatar'

export function SpendDistribution({ byFormat, byAngle, byAvatar }: SpendDistributionProps) {
  const [tab, setTab] = useState<Tab>('format')

  const tabs: { value: Tab; label: string }[] = [
    { value: 'format', label: 'Por Formato' },
    { value: 'angle', label: 'Por Angulo' },
    { value: 'avatar', label: 'Por Avatar' },
  ]

  let data: DistItem[] = []
  if (tab === 'format') {
    data = byFormat.map((d) => ({
      label: FORMATS.find((f) => f.value === d.format)?.label || d.format,
      ...d,
    }))
  } else if (tab === 'angle') {
    data = byAngle.map((d) => ({
      label: ANGLES.find((a) => a.value === d.angleType)?.label || d.angleType,
      ...d,
    }))
  } else {
    data = byAvatar.map((d) => ({ label: d.avatarName, ...d }))
  }

  const isEmpty = data.length === 0

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              tab === t.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {isEmpty ? (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          No hay datos para mostrar.
        </div>
      ) : (
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(v) => `$${v}`} />
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
              />
              <Legend formatter={(value) => (value === 'spend' ? 'Gasto' : 'Revenue')} />
              <Bar dataKey="spend" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
