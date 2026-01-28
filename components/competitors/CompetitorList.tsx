"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Loader2, Video, Image as ImageIcon } from 'lucide-react'

interface CompetitorAd {
  id: string
  thumbnailUrl: string | null
  mediaUrl: string
  mediaType: string
}

interface Competitor {
  id: string
  name: string
  description: string | null
  website: string | null
  tiktok: string | null
  instagram: string | null
  facebook: string | null
  _count: {
    ads: number
  }
  ads: CompetitorAd[]
}

interface CompetitorListProps {
  competitors: Competitor[]
}

export function CompetitorList({ competitors: initialCompetitors }: CompetitorListProps) {
  const router = useRouter()
  const [competitors, setCompetitors] = useState(initialCompetitors)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    description: '',
    website: '',
    tiktok: '',
    instagram: '',
    facebook: '',
  })

  const handleAdd = async () => {
    if (!newCompetitor.name.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompetitor),
      })

      if (response.ok) {
        const competitor = await response.json()
        setCompetitors([{ ...competitor, _count: { ads: 0 }, ads: [] }, ...competitors])
        setNewCompetitor({
          name: '',
          description: '',
          website: '',
          tiktok: '',
          instagram: '',
          facebook: '',
        })
        setIsAdding(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding competitor:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Competidor
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card className="border-2 border-primary">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Nuevo Competidor</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre*</Label>
                <Input
                  placeholder="Ej: Competidor X"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sitio Web</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={newCompetitor.website}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, website: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                placeholder="Que venden, que nicho atacan..."
                value={newCompetitor.description}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input
                  placeholder="@handle"
                  value={newCompetitor.tiktok}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, tiktok: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  placeholder="@handle"
                  value={newCompetitor.instagram}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, instagram: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  placeholder="Nombre de pagina"
                  value={newCompetitor.facebook}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, facebook: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!newCompetitor.name.trim() || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitors Grid */}
      {competitors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No hay competidores todavia. Agrega tu primer competidor para empezar a guardar sus ads.
            </p>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar Competidor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((competitor) => (
            <Link key={competitor.id} href={`/competitors/${competitor.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{competitor.name}</h3>
                      {competitor.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {competitor.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {competitor._count.ads} ads
                    </Badge>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-2 mb-3">
                    {competitor.tiktok && (
                      <Badge variant="outline" className="text-xs">🎵 TikTok</Badge>
                    )}
                    {competitor.instagram && (
                      <Badge variant="outline" className="text-xs">📷 IG</Badge>
                    )}
                    {competitor.facebook && (
                      <Badge variant="outline" className="text-xs">📘 FB</Badge>
                    )}
                  </div>

                  {/* Preview Thumbnails */}
                  {competitor.ads.length > 0 && (
                    <div className="grid grid-cols-4 gap-1">
                      {competitor.ads.slice(0, 4).map((ad) => (
                        <div
                          key={ad.id}
                          className="aspect-square bg-muted rounded overflow-hidden relative"
                        >
                          {ad.thumbnailUrl ? (
                            <img
                              src={ad.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : ad.mediaType === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {competitor.ads.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Sin ads todavia
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
