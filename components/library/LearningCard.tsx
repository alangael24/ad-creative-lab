"use client"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ANGLES, FORMATS } from '@/lib/constants'
import { formatCurrency, calculateROAS } from '@/lib/utils'
import { Image as ImageIcon, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react'

interface Ad {
  id: string
  name: string
  concept: string
  angle: string
  format: string
  hypothesis: string
  thumbnailUrl: string | null
  result: string | null
  diagnosis: string | null
  spend: number | null
  revenue: number | null
  learnings: { id: string; content: string }[]
  // Element results with notes
  hookResult: string | null
  hookNote: string | null
  avatarResult: string | null
  avatarNote: string | null
  scriptResult: string | null
  scriptNote: string | null
  ctaResult: string | null
  ctaNote: string | null
  visualResult: string | null
  visualNote: string | null
  audioResult: string | null
  audioNote: string | null
}

interface LearningCardProps {
  ad: Ad
}

export function LearningCard({ ad }: LearningCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const angleConfig = ANGLES.find(a => a.value === ad.angle)
  const formatConfig = FORMATS.find(f => f.value === ad.format)
  const roas = calculateROAS(ad.revenue, ad.spend)

  // Get element evaluations with notes
  const elementResults = [
    { key: 'hookResult', label: 'Hook', value: ad.hookResult, note: ad.hookNote },
    { key: 'avatarResult', label: 'Avatar', value: ad.avatarResult, note: ad.avatarNote },
    { key: 'scriptResult', label: 'Guion', value: ad.scriptResult, note: ad.scriptNote },
    { key: 'ctaResult', label: 'CTA', value: ad.ctaResult, note: ad.ctaNote },
    { key: 'visualResult', label: 'Visual', value: ad.visualResult, note: ad.visualNote },
    { key: 'audioResult', label: 'Audio', value: ad.audioResult, note: ad.audioNote },
  ].filter(e => e.value)

  const workedElements = elementResults.filter(e => e.value === 'worked')
  const failedElements = elementResults.filter(e => e.value === 'failed')

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        ad.result === 'winner' ? 'border-green-500/50' : 'border-red-500/50'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        {/* Header with thumbnail */}
        <div className="flex gap-3">
          <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
            {ad.thumbnailUrl ? (
              <img src={ad.thumbnailUrl} alt={ad.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={ad.result as 'winner' | 'loser'}>
                {ad.result === 'winner' ? 'Winner' : 'Loser'}
              </Badge>
              <Badge variant={ad.angle as 'fear' | 'desire' | 'curiosity' | 'offer' | 'tutorial' | 'testimonial'}>
                {angleConfig?.label || ad.angle}
              </Badge>
              <Badge variant="secondary">{formatConfig?.label || ad.format}</Badge>
            </div>
            <h3 className="font-semibold truncate">{ad.concept}</h3>
            <p className="text-xs text-muted-foreground truncate">{ad.name}</p>
            {/* Quick element indicators */}
            {elementResults.length > 0 && (
              <div className="flex gap-1 mt-1">
                {workedElements.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                    <ThumbsUp className="h-3 w-3" />
                    {workedElements.length}
                  </span>
                )}
                {failedElements.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
                    <ThumbsDown className="h-3 w-3" />
                    {failedElements.length}
                  </span>
                )}
              </div>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Element Results with Notes */}
            {elementResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">ELEMENTOS</p>
                {workedElements.map(e => (
                  <div
                    key={e.key}
                    className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-1 text-green-700 dark:text-green-400 text-xs font-medium mb-1">
                      <ThumbsUp className="h-3 w-3" />
                      {e.label}
                    </div>
                    {e.note && (
                      <p className="text-sm text-green-800 dark:text-green-300">{e.note}</p>
                    )}
                  </div>
                ))}
                {failedElements.map(e => (
                  <div
                    key={e.key}
                    className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-1 text-red-700 dark:text-red-400 text-xs font-medium mb-1">
                      <ThumbsDown className="h-3 w-3" />
                      {e.label}
                    </div>
                    {e.note && (
                      <p className="text-sm text-red-800 dark:text-red-300">{e.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Diagnosis/Learning */}
            {ad.diagnosis && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">APRENDIZAJE</p>
                <p className="text-sm bg-muted p-3 rounded-lg">&quot;{ad.diagnosis}&quot;</p>
              </div>
            )}

            {/* Additional Learnings */}
            {ad.learnings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">INSIGHTS ADICIONALES</p>
                <ul className="space-y-1">
                  {ad.learnings.map((learning) => (
                    <li key={learning.id} className="text-sm text-muted-foreground">
                      - {learning.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metrics */}
            {(ad.spend !== null || ad.revenue !== null) && (
              <div className="flex gap-4 text-sm">
                {ad.spend !== null && ad.spend !== undefined && (
                  <span>
                    <span className="text-muted-foreground">Gasto:</span> {formatCurrency(ad.spend)}
                  </span>
                )}
                {ad.revenue !== null && ad.revenue !== undefined && (
                  <span>
                    <span className="text-muted-foreground">Revenue:</span> {formatCurrency(ad.revenue)}
                  </span>
                )}
                {roas !== null && (
                  <span className={roas >= 1 ? 'text-green-600' : 'text-red-600'}>
                    <span className="text-muted-foreground">ROAS:</span> {roas.toFixed(2)}x
                  </span>
                )}
              </div>
            )}

            {/* Hypothesis */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">HIPOTESIS ORIGINAL</p>
              <p className="text-sm italic text-muted-foreground">&quot;{ad.hypothesis}&quot;</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
