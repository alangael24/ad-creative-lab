"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { COMPETITOR_PLATFORMS, COMPETITOR_AD_TAGS, ANGLES } from '@/lib/constants'
import { Play, X, ExternalLink, Trash2, Loader2, Filter, Building2 } from 'lucide-react'

interface Competitor {
  id: string
  name: string
}

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
  competitor: Competitor
}

interface FilterStats {
  platforms: Record<string, number>
  angles: Record<string, number>
  tags: Record<string, number>
}

interface CreativeWallProps {
  initialAds: CompetitorAd[]
  total: number
  filterStats: FilterStats
}

export function CreativeWall({ initialAds, total, filterStats }: CreativeWallProps) {
  const [ads, setAds] = useState(initialAds)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialAds.length < total)
  const [selectedAd, setSelectedAd] = useState<CompetitorAd | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [filterPlatform, setFilterPlatform] = useState<string>('')
  const [filterAngle, setFilterAngle] = useState<string>('')
  const [filterTag, setFilterTag] = useState<string>('')

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('offset', ads.length.toString())
      params.set('limit', '30')
      if (filterPlatform) params.set('platform', filterPlatform)
      if (filterAngle) params.set('angle', filterAngle)
      if (filterTag) params.set('tag', filterTag)

      const response = await fetch(`/api/competitor-ads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAds(prev => [...prev, ...data.ads])
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error loading more ads:', error)
    } finally {
      setIsLoading(false)
    }
  }, [ads.length, isLoading, hasMore, filterPlatform, filterAngle, filterTag])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [loadMore, hasMore, isLoading])

  // Apply filters
  const applyFilters = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '30')
      if (filterPlatform) params.set('platform', filterPlatform)
      if (filterAngle) params.set('angle', filterAngle)
      if (filterTag) params.set('tag', filterTag)

      const response = await fetch(`/api/competitor-ads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAds(data.ads)
        setHasMore(data.hasMore)
      }
    } catch (error) {
      console.error('Error filtering ads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setFilterPlatform('')
    setFilterAngle('')
    setFilterTag('')
    setAds(initialAds)
    setHasMore(initialAds.length < total)
  }

  const hasActiveFilters = filterPlatform || filterAngle || filterTag

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

  const handleDelete = async (adId: string) => {
    if (!confirm('¿Eliminar este ad?')) return

    try {
      const response = await fetch(`/api/competitor-ads/${adId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAds(ads.filter(a => a.id !== adId))
        setSelectedAd(null)
      }
    } catch (error) {
      console.error('Error deleting competitor ad:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Activo
            </Badge>
          )}
        </Button>

        <p className="text-sm text-muted-foreground">
          Mostrando {ads.length} de {total} ads
        </p>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Platform Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Plataforma</Label>
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Todas</option>
                  {Object.entries(filterStats.platforms).map(([platform, count]) => {
                    const config = getPlatformConfig(platform)
                    return (
                      <option key={platform} value={platform}>
                        {config?.icon} {config?.label || platform} ({count})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Angle Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Angulo</Label>
                <select
                  value={filterAngle}
                  onChange={(e) => setFilterAngle(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Todos</option>
                  {Object.entries(filterStats.angles).map(([angle, count]) => {
                    const config = getAngleConfig(angle)
                    return (
                      <option key={angle} value={angle}>
                        {config?.label || angle} ({count})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Tag Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Tag</Label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Todos</option>
                  {Object.entries(filterStats.tags).map(([tag, count]) => {
                    const config = COMPETITOR_AD_TAGS.find(t => t.value === tag)
                    return (
                      <option key={tag} value={tag}>
                        {config?.label || tag} ({count})
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={applyFilters}>
                Aplicar Filtros
              </Button>
              {hasActiveFilters && (
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pinterest-style Masonry Grid */}
      {ads.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No hay ads todavia. Agrega competidores y sus ads para verlos aqui.
            </p>
            <Link href="/competitors">
              <Button>Ir a Competidores</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
          {ads.map((ad) => {
            const platformConfig = getPlatformConfig(ad.platform)
            const angleConfig = getAngleConfig(ad.angle)
            const tags = parseJsonArray(ad.tags)

            return (
              <div
                key={ad.id}
                className="break-inside-avoid cursor-pointer group"
                onClick={() => setSelectedAd(ad)}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {ad.mediaType === 'video' ? (
                      <>
                        {ad.thumbnailUrl ? (
                          <img
                            src={ad.thumbnailUrl}
                            alt=""
                            className="w-full object-cover"
                          />
                        ) : (
                          <video
                            src={ad.mediaUrl}
                            className="w-full object-cover"
                            muted
                            preload="metadata"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-12 w-12 text-white drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={ad.mediaUrl}
                        alt=""
                        className="w-full object-cover"
                      />
                    )}

                    {/* Platform Badge */}
                    {platformConfig && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-black/70">
                          {platformConfig.icon}
                        </Badge>
                      </div>
                    )}

                    {/* Competitor Badge */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-black/70 truncate max-w-full">
                        <Building2 className="h-3 w-3 mr-1" />
                        {ad.competitor.name}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-2 space-y-1">
                    {ad.title && (
                      <p className="text-xs font-medium line-clamp-2">{ad.title}</p>
                    )}

                    {ad.hook && (
                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                        &quot;{ad.hook}&quot;
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {angleConfig && (
                        <Badge className={`text-[10px] ${angleConfig.color} text-white`}>
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
              </div>
            )
          })}
        </div>
      )}

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando mas...
          </div>
        )}
        {!hasMore && ads.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Has visto todos los {ads.length} ads
          </p>
        )}
      </div>

      {/* Selected Ad Modal */}
      {selectedAd && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAd(null)}
        >
          <Card
            className="max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Media */}
                <div className="bg-black flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
                  {selectedAd.mediaType === 'video' ? (
                    <video
                      src={selectedAd.mediaUrl}
                      className="max-w-full max-h-[70vh] object-contain"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={selectedAd.mediaUrl}
                      alt=""
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/competitors/${selectedAd.competitor.id}`}
                        className="flex items-center gap-1 text-sm text-blue-500 hover:underline mb-2"
                      >
                        <Building2 className="h-4 w-4" />
                        {selectedAd.competitor.name}
                      </Link>
                      {selectedAd.title && (
                        <h3 className="font-semibold text-lg">{selectedAd.title}</h3>
                      )}
                      <div className="flex items-center gap-2 mt-2">
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
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Tags */}
                  {parseJsonArray(selectedAd.tags).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {parseJsonArray(selectedAd.tags).map(tag => {
                        const tagConfig = COMPETITOR_AD_TAGS.find(t => t.value === tag)
                        return tagConfig ? (
                          <Badge key={tag} className={`${tagConfig.color} text-white`}>
                            {tagConfig.label}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  )}

                  {/* Hook */}
                  {selectedAd.hook && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <Label className="text-xs text-yellow-700 dark:text-yellow-400">Hook</Label>
                      <p className="text-sm mt-1 font-medium">&quot;{selectedAd.hook}&quot;</p>
                    </div>
                  )}

                  {/* CTA */}
                  {selectedAd.cta && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <Label className="text-xs text-blue-700 dark:text-blue-400">CTA</Label>
                      <p className="text-sm mt-1 font-medium">&quot;{selectedAd.cta}&quot;</p>
                    </div>
                  )}

                  {/* What Works */}
                  {selectedAd.whatWorks && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <Label className="text-xs text-green-700 dark:text-green-400">¿Que funciona?</Label>
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
                      <ExternalLink className="h-4 w-4" />
                      Ver original
                    </a>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Link href={`/competitors/${selectedAd.competitor.id}`}>
                      <Button variant="outline" size="sm">
                        <Building2 className="h-4 w-4 mr-1" />
                        Ver competidor
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
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
