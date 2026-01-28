"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FAIL_REASONS, SUCCESS_FACTORS } from '@/lib/constants'
import { AlertTriangle, Sparkles } from 'lucide-react'

interface TagDistributionProps {
  topFailReasons: Array<{ reason: string; count: number }>
  topSuccessFactors: Array<{ factor: string; count: number }>
  totalAnalyzed: number
}

export function TagDistribution({
  topFailReasons,
  topSuccessFactors,
  totalAnalyzed,
}: TagDistributionProps) {
  if (totalAnalyzed === 0) {
    return null
  }

  const maxFailCount = Math.max(...topFailReasons.map(r => r.count), 1)
  const maxSuccessCount = Math.max(...topSuccessFactors.map(f => f.count), 1)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Fail Reasons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            Por qué pierdes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topFailReasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {topFailReasons.map(({ reason, count }) => {
                const config = FAIL_REASONS.find(r => r.value === reason)
                const percentage = (count / maxFailCount) * 100

                return (
                  <div key={reason} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {config?.icon} {config?.label || reason}
                      </span>
                      <span className="text-muted-foreground">
                        {count}x ({Math.round((count / totalAnalyzed) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-green-600 dark:text-green-400">
            <Sparkles className="h-4 w-4" />
            Por qué ganas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSuccessFactors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {topSuccessFactors.map(({ factor, count }) => {
                const config = SUCCESS_FACTORS.find(f => f.value === factor)
                const percentage = (count / maxSuccessCount) * 100

                return (
                  <div key={factor} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {config?.icon} {config?.label || factor}
                      </span>
                      <span className="text-muted-foreground">
                        {count}x ({Math.round((count / totalAnalyzed) * 100)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
