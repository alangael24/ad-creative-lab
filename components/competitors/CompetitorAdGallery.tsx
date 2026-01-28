"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { COMPETITOR_PLATFORMS, COMPETITOR_AD_TAGS, ANGLES } from '@/lib/constants'
import { Plus, X, Loader2, Play, Trash2, ExternalLink } from 'lucide-react'

interface CompetitorAd {
  id: string
  mediaUrl: string
  mediaType: string
  thumbnailUrl: string | null
  title: string | null
  sourceUrl: string | null
  platform: string | null
  hook: string | null
  angle: string | null
  cta: string | null
  whatWorks: string | null
  notes: string | null
  tags: string | null
  createdAt: Date | string
}

interface CompetitorAdGalleryProps {
  competitorId: string
  competitorName: string
  ads: CompetitorAd[]
}

export function CompetitorAdGallery({ competitorId, competitorName, ads: initialAds }: CompetitorAdGalleryProps) {
  const router = useRouter()
  const [ads, setAds] = useState(initialAds)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedAd, setSelectedAd] = useState<CompetitorAd | null>(null)
  const [filter, setFilter] = useState<string>('')

  const [newAd, setNewAd] = useState({
    mediaUrl: '',
    mediaType: 'video',
    thumbnailUrl: '',
    title: '',
    sourceUrl: '',
    platform: 'tiktok',
    hook: '',
    angle: '',
    cta: '',
    whatWorks: '',
    notes: '',
    tags: [] as string[],
  })

  const handleAdd = async () => {
    if (!newAd.mediaUrl.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/competitors/${competitorId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAd,
          tags: newAd.tags.length > 0 ? JSON.stringify(newAd.tags) : null,
        }),
      })

      if (response.ok) {
        const ad = await response.json()
        setAds([ad, ...ads])
        setNewAd({
          mediaUrl: '',
          mediaType: 'video',
          thumbnailUrl: '',
          title: '',
          sourceUrl: '',
          platform: 'tiktok',
          hook: '',
          angle: '',
          cta: '',
          whatWorks: '',
          notes: '',
          tags: [],
        })
        setIsAdding(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding competitor ad:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (adId: string) => {
    if (!confirm('¿Eliminar este ad?')) return

    try {
      const response = await fetch(`/api/competitor-ads/${adId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAds(ads.filter(a => a.id !== adId))
        setSelectedAd(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting competitor ad:', error)
    }
  }

  const toggleTag = (tag: string) => {
    setNewAd(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const getPlatformConfig = (platform: string | null) =>
    COMPETITOR_PLATFORMS.find(p => p.value === platform)

  const getAngleConfig = (angle: string | null) =>
    ANGLES.find(a => a.value === angle)

  const parseJsonArray = (str: string | null): string[] => {
    if (!str) return []
    try {
      return JSON.parse(str) as string[]
    } catch {
      return []
    }
  }

  const filteredAds = filter
    ? ads.filter(ad => {
        const tags = parseJsonArray(ad.tags)
        return tags.includes(filter) || ad.angle === filter || ad.platform === filter
      })
    : ads

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ads de {competitorName}</h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Ad
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === '' ? 'default' : 'outline'}
          onClick={() => setFilter('')}
        >
          Todos ({ads.length})
        </Button>
        {COMPETITOR_AD_TAGS.slice(0, 6).map(tag => {
          const count = ads.filter(a => parseJsonArray(a.tags).includes(tag.value)).length
          if (count === 0) return null
          return (
            <Button
              key={tag.value}
              size="sm"
              variant={filter === tag.value ? 'default' : 'outline'}
              onClick={() => setFilter(tag.value)}
            >
              {tag.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Add Form */}
      {isAdding && (
        <Card className="border-2 border-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Nuevo Ad de Competidor</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Media Upload */}
            <div className="space-y-2">
              <Label>Video/Imagen*</Label>
              <FileUpload
                value={newAd.mediaUrl || undefined}
                onChange={(url) => setNewAd({ ...newAd, mediaUrl: url || '' })}
                accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/gif,image/webp"
                maxSize={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Media</Label>
                <select
                  value={newAd.mediaType}
                  onChange={(e) => setNewAd({ ...newAd, mediaType: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="video">Video</option>
                  <option value="image">Imagen</option>
                  <option value="carousel">Carrusel</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <select
                  value={newAd.platform}
                  onChange={(e) => setNewAd({ ...newAd, platform: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {COMPETITOR_PLATFORMS.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titulo (opcional)</Label>
                <Input
                  placeholder="Descripcion breve del ad"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Original (opcional)</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={newAd.sourceUrl}
                  onChange={(e) => setNewAd({ ...newAd, sourceUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Analysis Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hook que usan</Label>
                <Input
                  placeholder="Primeros segundos..."
                  value={newAd.hook}
                  onChange={(e) => setNewAd({ ...newAd, hook: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Angulo</Label>
                <select
                  value={newAd.angle}
                  onChange={(e) => setNewAd({ ...newAd, angle: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Seleccionar...</option>
                  {ANGLES.map(a => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>CTA que usan</Label>
              <Input
                placeholder="Ej: Compra ahora con 50% OFF"
                value={newAd.cta}
                onChange={(e) => setNewAd({ ...newAd, cta: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>¿Que funciona de este ad?</Label>
              <Textarea
                placeholder="Analiza por que crees que este ad funciona..."
                value={newAd.whatWorks}
                onChange={(e) => setNewAd({ ...newAd, whatWorks: e.target.value })}
                rows={2}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {COMPETITOR_AD_TAGS.map(tag => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      newAd.tags.includes(tag.value)
                        ? `${tag.color} text-white`
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={!newAd.mediaUrl.trim() || isSaving}>
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

      {/* Ads Grid */}
      {filteredAds.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">
              {ads.length === 0
                ? 'No hay ads todavia. Agrega el primer ad de este competidor.'
                : 'No hay ads con ese filtro.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAds.map((ad) => {
            const platformConfig = getPlatformConfig(ad.platform)
            const angleConfig = getAngleConfig(ad.angle)
            const tags = parseJsonArray(ad.tags)

            return (
              <Card
                key={ad.id}
                className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
                onClick={() => setSelectedAd(ad)}
              >
                <div className="aspect-[9/16] bg-muted relative">
                  {ad.mediaType === 'video' ? (
                    <>
                      {ad.thumbnailUrl ? (
                        <img
                          src={ad.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={ad.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-10 w-10 text-white" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={ad.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Platform Badge */}
                  {platformConfig && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {platformConfig.icon}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-2">
                  {ad.title && (
                    <p className="text-xs font-medium truncate">{ad.title}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {angleConfig && (
                      <Badge variant="secondary" className={`text-[10px] ${angleConfig.color} text-white`}>
                        {angleConfig.label}
                      </Badge>
                    )}
                    {tags.slice(0, 2).map(tag => {
                      const tagConfig = COMPETITOR_AD_TAGS.find(t => t.value === tag)
                      return tagConfig ? (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tagConfig.label}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Selected Ad Modal */}
      {selectedAd && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAd(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Media */}
                <div className="aspect-[9/16] md:aspect-auto md:h-full bg-black relative">
                  {selectedAd.mediaType === 'video' ? (
                    <video
                      src={selectedAd.mediaUrl}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={selectedAd.mediaUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      {selectedAd.title && (
                        <h3 className="font-semibold">{selectedAd.title}</h3>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getPlatformConfig(selectedAd.platform) && (
                          <Badge variant="secondary">
                            {getPlatformConfig(selectedAd.platform)?.icon}{' '}
                            {getPlatformConfig(selectedAd.platform)?.label}
                          </Badge>
                        )}
                        {getAngleConfig(selectedAd.angle) && (
                          <Badge className={getAngleConfig(selectedAd.angle)?.color}>
                            {getAngleConfig(selectedAd.angle)?.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedAd(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Tags */}
                  {parseJsonArray(selectedAd.tags).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {parseJsonArray(selectedAd.tags).map(tag => {
                        const tagConfig = COMPETITOR_AD_TAGS.find(t => t.value === tag)
                        return tagConfig ? (
                          <Badge key={tag} className={`${tagConfig.color} text-white text-xs`}>
                            {tagConfig.label}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}

                  {/* Hook */}
                  {selectedAd.hook && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Hook</Label>
                      <p className="text-sm mt-1">&quot;{selectedAd.hook}&quot;</p>
                    </div>
                  )}

                  {/* CTA */}
                  {selectedAd.cta && (
                    <div>
                      <Label className="text-xs text-muted-foreground">CTA</Label>
                      <p className="text-sm mt-1">&quot;{selectedAd.cta}&quot;</p>
                    </div>
                  )}

                  {/* What Works */}
                  {selectedAd.whatWorks && (
                    <div>
                      <Label className="text-xs text-muted-foreground">¿Que funciona?</Label>
                      <p className="text-sm mt-1">{selectedAd.whatWorks}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedAd.notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Notas</Label>
                      <p className="text-sm mt-1">{selectedAd.notes}</p>
                    </div>
                  )}

                  {/* Source URL */}
                  {selectedAd.sourceUrl && (
                    <a
                      href={selectedAd.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver original
                    </a>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(selectedAd.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
