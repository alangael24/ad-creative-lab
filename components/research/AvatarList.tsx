"use client"

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, FileText, Tv, MessageSquare, Target } from 'lucide-react'

interface Avatar {
  id: string
  name: string
  description: string | null
  painPoints: string
  desires: string
  organicStyle: string | null
  ageRange: string | null
  gender: string | null
  researchCount: number
  adsCount: number
}

interface AvatarListProps {
  avatars: Avatar[]
}

export function AvatarList({ avatars }: AvatarListProps) {
  if (avatars.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay avatars definidos</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer avatar para empezar a documentar tu research
          </p>
          <Link
            href="/research/avatars/new"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            Crear primer Avatar
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {avatars.map((avatar) => {
        let painPointsArray: string[] = []
        let desiresArray: string[] = []

        try {
          painPointsArray = JSON.parse(avatar.painPoints) as string[]
        } catch { /* ignore */ }

        try {
          desiresArray = JSON.parse(avatar.desires) as string[]
        } catch { /* ignore */ }

        return (
          <Link key={avatar.id} href={`/research/avatars/${avatar.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    {avatar.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    {avatar.ageRange && (
                      <Badge variant="secondary" className="text-xs">
                        {avatar.ageRange}
                      </Badge>
                    )}
                    {avatar.gender && (
                      <Badge variant="secondary" className="text-xs">
                        {avatar.gender === 'female' ? '♀' : avatar.gender === 'male' ? '♂' : '⚥'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {avatar.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {avatar.description}
                  </p>
                )}

                {/* Pain Points Preview */}
                {painPointsArray.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Pain Points
                    </p>
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      {painPointsArray[0]}
                    </p>
                  </div>
                )}

                {/* Desires Preview */}
                {desiresArray.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Deseos
                    </p>
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      {desiresArray[0]}
                    </p>
                  </div>
                )}

                {/* Organic Style */}
                {avatar.organicStyle && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tv className="h-3 w-3" />
                    <span className="line-clamp-1">{avatar.organicStyle}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-4 pt-2 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {avatar.researchCount} items
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {avatar.adsCount} ads
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
