"use client"

import Link from 'next/link'
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Ad {
  id: string
  name: string
  concept: string
  dueDate: string
  status: string
}

interface DueDateAlertsProps {
  overdueAds: Ad[]
  dueSoonAds: Ad[]
}

export function DueDateAlerts({ overdueAds, dueSoonAds }: DueDateAlertsProps) {
  if (overdueAds.length === 0 && dueSoonAds.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Overdue Ads */}
      {overdueAds.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="font-semibold text-red-700 dark:text-red-400">
              {overdueAds.length} {overdueAds.length === 1 ? 'ad vencido' : 'ads vencidos'}
            </p>
          </div>
          <ul className="space-y-2">
            {overdueAds.slice(0, 3).map((ad) => (
              <li key={ad.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{ad.concept}</span>
                  <span className="text-xs text-muted-foreground">
                    Vencio el {new Date(ad.dueDate).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <Link href={`/ads/${ad.id}`}>
                  <Button size="sm" variant="outline" className="h-7 ml-2">
                    Ver <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Due Soon Ads */}
      {dueSoonAds.length > 0 && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-orange-500" />
            <p className="font-semibold text-orange-700 dark:text-orange-400">
              {dueSoonAds.length} {dueSoonAds.length === 1 ? 'ad por vencer' : 'ads por vencer'} (proximos 3 dias)
            </p>
          </div>
          <ul className="space-y-2">
            {dueSoonAds.slice(0, 3).map((ad) => {
              const daysUntil = Math.ceil(
                (new Date(ad.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              )
              return (
                <li key={ad.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{ad.concept}</span>
                    <span className="text-xs text-muted-foreground">
                      {daysUntil === 0 ? 'Vence hoy' : daysUntil === 1 ? 'Vence manana' : `Vence en ${daysUntil} dias`}
                    </span>
                  </div>
                  <Link href={`/ads/${ad.id}`}>
                    <Button size="sm" variant="outline" className="h-7 ml-2">
                      Ver <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
