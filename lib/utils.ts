import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function calculateROAS(revenue: number | null, spend: number | null): number | null {
  if (!revenue || !spend || spend === 0) return null
  return revenue / spend
}

export function getDaysRemaining(reviewDate: Date | string | null): number {
  if (!reviewDate) return 0
  const now = new Date()
  const review = new Date(reviewDate)
  const diffTime = review.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export function isLockExpired(reviewDate: Date | string | null): boolean {
  if (!reviewDate) return true
  return new Date(reviewDate) <= new Date()
}

// === VIDEO METRICS ===

export interface VideoMetrics {
  hookRate: number | null          // % de impresiones que vieron 3 seg
  holdRate: number | null          // % de vistas 3seg que vieron completo
  hookRateStatus: 'good' | 'warning' | 'failed' | null
  holdRateStatus: 'good' | 'warning' | 'failed' | null
  suggestedHookResult: 'worked' | 'failed' | null
  suggestedScriptResult: 'worked' | 'failed' | null
}

/**
 * Calcula Hook Rate: Vistas de 3 seg / Impresiones
 * - < 20% = Hook malo (failed)
 * - 20-30% = Warning
 * - > 30% = Bueno
 */
export function calculateHookRate(
  videoViewThreeSeconds: number | null,
  impressions: number | null
): number | null {
  if (!videoViewThreeSeconds || !impressions || impressions === 0) return null
  return (videoViewThreeSeconds / impressions) * 100
}

/**
 * Calcula Hold Rate: Thruplays / Vistas de 3 seg
 * - < 15% = Guion aburrido (failed)
 * - 15-25% = Warning
 * - > 25% = Guion retiene
 */
export function calculateHoldRate(
  videoViewThruplay: number | null,
  videoViewThreeSeconds: number | null
): number | null {
  if (!videoViewThruplay || !videoViewThreeSeconds || videoViewThreeSeconds === 0) return null
  return (videoViewThruplay / videoViewThreeSeconds) * 100
}

/**
 * Analiza todas las métricas de video y sugiere resultados automáticos
 */
export function analyzeVideoMetrics(
  impressions: number | null,
  videoViewThreeSeconds: number | null,
  videoViewThruplay: number | null
): VideoMetrics {
  const hookRate = calculateHookRate(videoViewThreeSeconds, impressions)
  const holdRate = calculateHoldRate(videoViewThruplay, videoViewThreeSeconds)

  // Determinar status del Hook Rate
  let hookRateStatus: VideoMetrics['hookRateStatus'] = null
  let suggestedHookResult: VideoMetrics['suggestedHookResult'] = null

  if (hookRate !== null) {
    if (hookRate < 20) {
      hookRateStatus = 'failed'
      suggestedHookResult = 'failed'
    } else if (hookRate < 30) {
      hookRateStatus = 'warning'
    } else {
      hookRateStatus = 'good'
      suggestedHookResult = 'worked'
    }
  }

  // Determinar status del Hold Rate
  let holdRateStatus: VideoMetrics['holdRateStatus'] = null
  let suggestedScriptResult: VideoMetrics['suggestedScriptResult'] = null

  if (holdRate !== null) {
    if (holdRate < 15) {
      holdRateStatus = 'failed'
      suggestedScriptResult = 'failed'
    } else if (holdRate < 25) {
      holdRateStatus = 'warning'
    } else {
      holdRateStatus = 'good'
      suggestedScriptResult = 'worked'
    }
  }

  return {
    hookRate,
    holdRate,
    hookRateStatus,
    holdRateStatus,
    suggestedHookResult,
    suggestedScriptResult,
  }
}

/**
 * Formatea el porcentaje para mostrar
 */
export function formatPercentage(value: number | null): string {
  if (value === null) return '-'
  return `${value.toFixed(1)}%`
}
