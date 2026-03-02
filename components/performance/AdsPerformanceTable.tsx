'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpDown } from 'lucide-react'

interface AdPerf {
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
}

type SortKey = 'spend' | 'revenue' | 'roas' | 'cpa' | 'ctr' | 'purchases'

export function AdsPerformanceTable({ data }: { data: AdPerf[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('spend')
  const [sortDesc, setSortDesc] = useState(true)

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(key)
      setSortDesc(true)
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortBy] ?? -Infinity
    const bv = b[sortBy] ?? -Infinity
    return sortDesc ? (bv as number) - (av as number) : (av as number) - (bv as number)
  })

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No hay ads con metricas registradas.
      </p>
    )
  }

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="text-right py-2 px-2 font-medium cursor-pointer hover:text-foreground select-none"
      onClick={() => toggleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === field && <ArrowUpDown className="h-3 w-3" />}
      </span>
    </th>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pr-2 font-medium">Ad</th>
            <th className="text-left py-2 px-2 font-medium">Formato</th>
            <SortHeader label="Gasto" field="spend" />
            <SortHeader label="Revenue" field="revenue" />
            <SortHeader label="ROAS" field="roas" />
            <SortHeader label="CPA" field="cpa" />
            <SortHeader label="CTR" field="ctr" />
            <SortHeader label="Compras" field="purchases" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((ad) => (
            <tr key={ad.adId} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2 pr-2">
                <Link href={`/ads/${ad.adId}`} className="hover:underline">
                  <span className="font-medium">{ad.concept}</span>
                  <span className="block text-xs text-muted-foreground font-mono">{ad.adName}</span>
                </Link>
              </td>
              <td className="py-2 px-2">
                <Badge variant="secondary" className="text-xs">{ad.format}</Badge>
              </td>
              <td className="py-2 px-2 text-right">{formatCurrency(ad.spend)}</td>
              <td className="py-2 px-2 text-right">{formatCurrency(ad.revenue)}</td>
              <td className="py-2 px-2 text-right">
                {ad.roas !== null ? (
                  <span className={ad.roas >= 1 ? 'text-green-600' : 'text-red-600'}>
                    {ad.roas.toFixed(2)}x
                  </span>
                ) : '-'}
              </td>
              <td className="py-2 px-2 text-right">
                {ad.cpa !== null ? formatCurrency(ad.cpa) : '-'}
              </td>
              <td className="py-2 px-2 text-right">
                {ad.ctr !== null ? `${ad.ctr.toFixed(2)}%` : '-'}
              </td>
              <td className="py-2 px-2 text-right">{ad.purchases}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
