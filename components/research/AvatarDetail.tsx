"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ORGANIC_STYLES } from '@/lib/constants'
import { User, Target, Sparkles, Ban, Tv, MessageSquare, FileText } from 'lucide-react'
import Link from 'next/link'

interface Avatar {
  id: string
  name: string
  description: string | null
  painPoints: string
  desires: string
  objections: string | null
  organicStyle: string | null
  language: string | null
  ageRange: string | null
  gender: string | null
  location: string | null
  ads: Array<{
    id: string
    name: string
    concept: string
    status: string
    result: string | null
    thumbnailUrl: string | null
  }>
}

interface AvatarDetailProps {
  avatar: Avatar
}

export function AvatarDetail({ avatar }: AvatarDetailProps) {
  let painPoints: string[] = []
  let desires: string[] = []
  let objections: string[] = []

  try {
    painPoints = JSON.parse(avatar.painPoints) as string[]
  } catch { /* ignore */ }

  try {
    desires = JSON.parse(avatar.desires) as string[]
  } catch { /* ignore */ }

  try {
    if (avatar.objections) {
      objections = JSON.parse(avatar.objections) as string[]
    }
  } catch { /* ignore */ }

  const organicStyleConfig = ORGANIC_STYLES.find(s => s.value === avatar.organicStyle)

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {avatar.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {avatar.description && (
            <p className="text-sm text-muted-foreground">{avatar.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {avatar.ageRange && (
              <Badge variant="secondary">{avatar.ageRange} años</Badge>
            )}
            {avatar.gender && (
              <Badge variant="secondary">
                {avatar.gender === 'female' ? 'Femenino' : avatar.gender === 'male' ? 'Masculino' : 'Ambos'}
              </Badge>
            )}
            {avatar.location && (
              <Badge variant="secondary">{avatar.location}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pain Points */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="pb-2 bg-red-50 dark:bg-red-950/30">
          <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
            <Target className="h-4 w-4" />
            Luchas Diarias
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="space-y-2">
            {painPoints.map((point, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                {point}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Desires */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="pb-2 bg-green-50 dark:bg-green-950/30">
          <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
            <Sparkles className="h-4 w-4" />
            Deseos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <ul className="space-y-2">
            {desires.map((desire, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                {desire}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Objections */}
      {objections.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2 bg-amber-50 dark:bg-amber-950/30">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Ban className="h-4 w-4" />
              Objeciones
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <ul className="space-y-2">
              {objections.map((objection, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-amber-500 mt-1">•</span>
                  {objection}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Organic Style */}
      {organicStyleConfig && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-950/30">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Tv className="h-4 w-4" />
              Contenido Orgánico
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-sm font-medium">{organicStyleConfig.label}</p>
            <p className="text-xs text-muted-foreground">{organicStyleConfig.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Language */}
      {avatar.language && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2 bg-purple-50 dark:bg-purple-950/30">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <MessageSquare className="h-4 w-4" />
              Lenguaje
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-sm italic">&quot;{avatar.language}&quot;</p>
          </CardContent>
        </Card>
      )}

      {/* Related Ads */}
      {avatar.ads.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ads para este Avatar ({avatar.ads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2">
            {avatar.ads.slice(0, 5).map(ad => (
              <Link
                key={ad.id}
                href={`/ads/${ad.id}`}
                className="block p-2 rounded hover:bg-muted transition-colors"
              >
                <p className="text-sm font-medium">{ad.concept}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={ad.status as 'idea' | 'production' | 'testing' | 'analysis'}>
                    {ad.status}
                  </Badge>
                  {ad.result && (
                    <Badge variant={ad.result as 'winner' | 'loser'}>
                      {ad.result}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
