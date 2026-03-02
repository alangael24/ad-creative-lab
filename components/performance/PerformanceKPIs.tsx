'use client'

import { DollarSign, TrendingUp, Target, MousePointerClick } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface KPIData {
  spend: number
  revenue: number
  roas: number | null
  cpa: number | null
  ctr: number | null
}

export function PerformanceKPIs({ data }: { data: KPIData }) {
  const kpis = [
    {
      label: 'Gasto Total',
      value: formatCurrency(data.spend),
      icon: DollarSign,
      color: 'text-red-500',
    },
    {
      label: 'ROAS',
      value: data.roas !== null ? `${data.roas.toFixed(2)}x` : '-',
      icon: TrendingUp,
      color: data.roas !== null && data.roas >= 1 ? 'text-green-500' : 'text-red-500',
    },
    {
      label: 'CPA',
      value: data.cpa !== null ? formatCurrency(data.cpa) : '-',
      icon: Target,
      color: 'text-blue-500',
    },
    {
      label: 'CTR',
      value: data.ctr !== null ? `${data.ctr.toFixed(2)}%` : '-',
      icon: MousePointerClick,
      color: 'text-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div key={kpi.label} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 ${kpi.color}`} />
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </div>
        )
      })}
    </div>
  )
}
