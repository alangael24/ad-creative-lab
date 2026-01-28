"use client"

import { useState, useMemo } from 'react'
import { FilterBar } from './FilterBar'
import { LearningCard } from './LearningCard'

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

interface AdGalleryProps {
  ads: Ad[]
}

export function AdGallery({ ads }: AdGalleryProps) {
  const [resultFilter, setResultFilter] = useState('')
  const [angleFilter, setAngleFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [elementFilter, setElementFilter] = useState('')
  const [elementStatus, setElementStatus] = useState('')

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      // Result filter
      if (resultFilter && ad.result !== resultFilter) return false

      // Angle filter
      if (angleFilter && ad.angle !== angleFilter) return false

      // Format filter
      if (formatFilter && ad.format !== formatFilter) return false

      // Element filter
      if (elementFilter && elementStatus) {
        const elementValue = ad[elementFilter as keyof Ad]
        if (elementValue !== elementStatus) return false
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchableText = [
          ad.concept,
          ad.name,
          ad.hypothesis,
          ad.diagnosis,
          ...ad.learnings.map(l => l.content),
        ].filter(Boolean).join(' ').toLowerCase()

        if (!searchableText.includes(query)) return false
      }

      return true
    })
  }, [ads, resultFilter, angleFilter, formatFilter, searchQuery, elementFilter, elementStatus])

  return (
    <div className="space-y-6">
      <FilterBar
        resultFilter={resultFilter}
        angleFilter={angleFilter}
        formatFilter={formatFilter}
        searchQuery={searchQuery}
        elementFilter={elementFilter}
        elementStatus={elementStatus}
        onResultChange={setResultFilter}
        onAngleChange={setAngleFilter}
        onFormatChange={setFormatFilter}
        onSearchChange={setSearchQuery}
        onElementChange={setElementFilter}
        onElementStatusChange={setElementStatus}
      />

      {filteredAds.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No se encontraron anuncios</p>
          <p className="text-sm mt-1">Ajusta los filtros o completa mas analisis</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAds.map((ad) => (
            <LearningCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="flex justify-center gap-6 text-sm text-muted-foreground pt-4 border-t">
        <span>
          <strong>{filteredAds.filter(a => a.result === 'winner').length}</strong> Winners
        </span>
        <span>
          <strong>{filteredAds.filter(a => a.result === 'loser').length}</strong> Losers
        </span>
        <span>
          <strong>{filteredAds.length}</strong> Total
        </span>
      </div>
    </div>
  )
}
