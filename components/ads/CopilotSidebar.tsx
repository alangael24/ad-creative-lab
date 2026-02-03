"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FAIL_REASONS, SUCCESS_FACTORS } from '@/lib/constants'
import { AlertTriangle, Lightbulb, ThumbsUp, ThumbsDown, Loader2, Brain } from 'lucide-react'

interface Insight {
  note: string
  result: string | null
  concept: string
}

interface Suggestions {
  learnings: Array<{
    id: string
    content: string
    result: string | null
    ad: {
      name: string
      concept: string
      result: string | null
    } | null
  }>
  insights: {
    workingHooks: Insight[]
    failedHooks: Insight[]
    workingCTAs: Insight[]
    workingVisuals: Insight[]
    failedVisuals: Insight[]
    topFailReasons: Array<{ reason: string; count: number }>
    topSuccessFactors: Array<{ factor: string; count: number }>
  }
  meta: {
    totalAdsAnalyzed: number
    filterApplied: { angleType: string | null; awareness: string | null; format: string | null }
  }
}

interface CopilotSidebarProps {
  angleType: string
  awareness: string
  avatarId: string
  format: string
  concept: string
}

export function CopilotSidebar({ angleType, awareness, avatarId, format, concept }: CopilotSidebarProps) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!angleType && !format) {
      setSuggestions(null)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (angleType) params.set('angleType', angleType)
        if (awareness) params.set('awareness', awareness)
        if (format) params.set('format', format)
        if (concept) params.set('concept', concept)

        const response = await fetch(`/api/learnings/suggestions?${params}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce the fetch
    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [angleType, awareness, format, concept])

  if (!angleType && !format) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-center text-muted-foreground">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Selecciona un ángulo o formato para ver sugerencias basadas en tu historial</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">Analizando historial...</p>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions || suggestions.meta.totalAdsAnalyzed === 0) {
    return (
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 text-center">
          <Lightbulb className="h-6 w-6 mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            No hay datos históricos para esta combinación. ¡Será tu primer experimento!
          </p>
        </CardContent>
      </Card>
    )
  }

  const { insights } = suggestions

  return (
    <div className="space-y-4">
      <Card className="border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Brain className="h-4 w-4" />
            Copiloto de Creación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Basado en <strong>{suggestions.meta.totalAdsAnalyzed}</strong> ads analizados
          </p>

          {/* Warnings - Failed patterns */}
          {(insights.failedHooks.length > 0 || insights.failedVisuals.length > 0 || insights.topFailReasons.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Evita esto:
              </div>

              {insights.topFailReasons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {insights.topFailReasons.map(({ reason, count }) => {
                    const config = FAIL_REASONS.find(r => r.value === reason)
                    return (
                      <Badge key={reason} variant="destructive" className="text-xs">
                        {config?.icon} {config?.label || reason} ({count}x)
                      </Badge>
                    )
                  })}
                </div>
              )}

              {insights.failedHooks.map((hook, i) => (
                <div key={i} className="p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-800 dark:text-red-200">
                  <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mb-1">
                    <ThumbsDown className="h-3 w-3" />
                    Hook que falló
                  </div>
                  &quot;{hook.note}&quot;
                </div>
              ))}

              {insights.failedVisuals.map((visual, i) => (
                <div key={i} className="p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-800 dark:text-red-200">
                  <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mb-1">
                    <ThumbsDown className="h-3 w-3" />
                    Visual que falló
                  </div>
                  &quot;{visual.note}&quot;
                </div>
              ))}
            </div>
          )}

          {/* Successes - Working patterns */}
          {(insights.workingHooks.length > 0 || insights.workingCTAs.length > 0 || insights.topSuccessFactors.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                <Lightbulb className="h-4 w-4" />
                Esto funciona:
              </div>

              {insights.topSuccessFactors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {insights.topSuccessFactors.map(({ factor, count }) => {
                    const config = SUCCESS_FACTORS.find(f => f.value === factor)
                    return (
                      <Badge key={factor} className="text-xs bg-green-600">
                        {config?.icon} {config?.label || factor} ({count}x)
                      </Badge>
                    )
                  })}
                </div>
              )}

              {insights.workingHooks.map((hook, i) => (
                <div key={i} className="p-2 bg-green-100 dark:bg-green-900/30 rounded text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                    <ThumbsUp className="h-3 w-3" />
                    Hook ganador
                  </div>
                  &quot;{hook.note}&quot;
                </div>
              ))}

              {insights.workingCTAs.map((cta, i) => (
                <div key={i} className="p-2 bg-green-100 dark:bg-green-900/30 rounded text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                    <ThumbsUp className="h-3 w-3" />
                    CTA efectivo
                  </div>
                  &quot;{cta.note}&quot;
                </div>
              ))}

              {insights.workingVisuals.map((visual, i) => (
                <div key={i} className="p-2 bg-green-100 dark:bg-green-900/30 rounded text-green-800 dark:text-green-200">
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                    <ThumbsUp className="h-3 w-3" />
                    Visual ganador
                  </div>
                  &quot;{visual.note}&quot;
                </div>
              ))}
            </div>
          )}

          {/* Recent learnings */}
          {suggestions.learnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <Brain className="h-4 w-4" />
                Aprendizajes recientes:
              </div>
              {suggestions.learnings.slice(0, 3).map((learning) => (
                <div key={learning.id} className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-200">
                  <p className="text-xs mb-1">
                    {learning.ad?.concept && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {learning.result === 'winner' ? '🏆' : '💀'} {learning.ad.concept}:
                      </span>
                    )}
                  </p>
                  &quot;{learning.content}&quot;
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
