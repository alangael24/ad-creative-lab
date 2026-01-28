"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Globe, Trash2, ExternalLink } from 'lucide-react'

interface Competitor {
  id: string
  name: string
  description: string | null
  website: string | null
  tiktok: string | null
  instagram: string | null
  facebook: string | null
  notes: string | null
}

interface CompetitorDetailProps {
  competitor: Competitor
}

export function CompetitorDetail({ competitor }: CompetitorDetailProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar ${competitor.name} y todos sus ads?`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/competitors/${competitor.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/competitors')
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting competitor:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {competitor.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {competitor.description && (
            <p className="text-sm text-muted-foreground">{competitor.description}</p>
          )}

          {/* Website */}
          {competitor.website && (
            <a
              href={competitor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-500 hover:underline"
            >
              <Globe className="h-4 w-4" />
              {competitor.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Social Links */}
          <div className="space-y-2">
            {competitor.tiktok && (
              <a
                href={`https://tiktok.com/@${competitor.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <Badge variant="secondary">🎵 TikTok</Badge>
                {competitor.tiktok}
              </a>
            )}
            {competitor.instagram && (
              <a
                href={`https://instagram.com/${competitor.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <Badge variant="secondary">📷 Instagram</Badge>
                {competitor.instagram}
              </a>
            )}
            {competitor.facebook && (
              <a
                href={`https://facebook.com/${competitor.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline"
              >
                <Badge variant="secondary">📘 Facebook</Badge>
                {competitor.facebook}
              </a>
            )}
          </div>

          {/* Notes */}
          {competitor.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Notas:</p>
              <p className="text-sm">{competitor.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Button */}
      <Button
        variant="outline"
        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? 'Eliminando...' : 'Eliminar Competidor'}
      </Button>
    </div>
  )
}
