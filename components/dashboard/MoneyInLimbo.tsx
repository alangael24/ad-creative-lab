"use client"

import { DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface MoneyInLimboProps {
  totalBudget: number
  adsCount: number
}

export function MoneyInLimbo({ totalBudget, adsCount }: MoneyInLimboProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="p-3 bg-amber-500 rounded-full">
        <DollarSign className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Presupuesto en Limbo</p>
        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
          {formatCurrency(totalBudget)}
        </p>
        <p className="text-xs text-muted-foreground">
          {adsCount} {adsCount === 1 ? 'anuncio' : 'anuncios'} en testeo activo
        </p>
      </div>
    </div>
  )
}
