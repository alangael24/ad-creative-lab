'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerformanceKPIs } from './PerformanceKPIs'
import { SpendRevenueChart } from './SpendRevenueChart'
import { SpendDistribution } from './SpendDistribution'
import { AdsPerformanceTable } from './AdsPerformanceTable'
import { DateRangeFilter } from './DateRangeFilter'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface PerformanceData {
  totals: {
    spend: number
    revenue: number
    impressions: number
    clicks: number
    purchases: number
    roas: number | null
    cpa: number | null
    cpm: number | null
    ctr: number | null
  }
  daily: { date: string; spend: number; revenue: number }[]
  perAd: {
    adId: string
    adName: string
    concept: string
    format: string
    angleType: string
    spend: number
    revenue: number
    impressions: number
    clicks: number
    purchases: number
    roas: number | null
    cpa: number | null
    ctr: number | null
  }[]
  byFormat: { format: string; spend: number; revenue: number; count: number }[]
  byAngle: { angleType: string; spend: number; revenue: number; count: number }[]
  byAvatar: { avatarName: string; spend: number; revenue: number; count: number }[]
}

export function PerformanceDashboard() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    const res = await fetch(`/api/performance?${params.toString()}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [from, to])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />

      {/* KPIs */}
      <PerformanceKPIs data={data.totals} />

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Revenue Total</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totals.revenue)}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Impresiones</p>
          <p className="text-2xl font-bold">{data.totals.impressions.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Clicks</p>
          <p className="text-2xl font-bold">{data.totals.clicks.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Compras</p>
          <p className="text-2xl font-bold">{data.totals.purchases}</p>
        </div>
      </div>

      {/* Spend vs Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gasto vs Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendRevenueChart data={data.daily} />
        </CardContent>
      </Card>

      {/* Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribucion de Gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendDistribution
            byFormat={data.byFormat}
            byAngle={data.byAngle}
            byAvatar={data.byAvatar}
          />
        </CardContent>
      </Card>

      {/* Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rendimiento por Ad</CardTitle>
        </CardHeader>
        <CardContent>
          <AdsPerformanceTable data={data.perAd} />
        </CardContent>
      </Card>
    </div>
  )
}
