"use client"

import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Ad {
  id: string
  name: string
  reviewDate: string | null
}

interface ActionAlertsProps {
  adsReadyForAnalysis: Ad[]
}

export function ActionAlerts({ adsReadyForAnalysis }: ActionAlertsProps) {
  if (adsReadyForAnalysis.length === 0) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-green-700 dark:text-green-400 font-medium">
          Sin alertas pendientes
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Todos tus anuncios estan al dia.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <p className="font-semibold text-red-700 dark:text-red-400">
          {adsReadyForAnalysis.length} {adsReadyForAnalysis.length === 1 ? 'anuncio listo' : 'anuncios listos'} para analizar
        </p>
      </div>
      <ul className="space-y-2">
        {adsReadyForAnalysis.slice(0, 5).map((ad) => (
          <li key={ad.id} className="flex items-center justify-between">
            <span className="text-sm truncate max-w-[200px]">{ad.name}</span>
            <Link href={`/ads/${ad.id}`}>
              <Button size="sm" variant="outline" className="h-7">
                Analizar <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </li>
        ))}
      </ul>
      {adsReadyForAnalysis.length > 5 && (
        <p className="text-sm text-muted-foreground mt-2">
          Y {adsReadyForAnalysis.length - 5} mas...
        </p>
      )}
    </div>
  )
}
