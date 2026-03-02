'use client'

import { useState } from 'react'
import { Sparkles, Check, Loader2, ChevronDown, ChevronUp, User, UserPlus, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface AvatarMatch {
  type: 'existing' | 'new'
  existing_avatar_id: string | null
  existing_avatar_name: string | null
  suggested_avatar_name: string | null
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

interface Extraction {
  original_text: string
  pain_points: string[]
  desires: string[]
  objections: string[]
  language: string[]
  suggested_angles: string[]
  avatar_match?: AvatarMatch
}

interface ExtractorProps {
  insightId: string
  onSave: (items: SavedItem[]) => void
}

interface SavedItem {
  content: string
  category: 'pain_point' | 'desire' | 'objection' | 'language'
  context?: string
  avatarId?: string | null
}

const CATEGORY_CONFIG = {
  pain_points: { label: 'Pain Points', category: 'pain_point' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  desires: { label: 'Deseos', category: 'desire' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  objections: { label: 'Objeciones', category: 'objection' as const, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  language: { label: 'Lenguaje', category: 'language' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
}

const ANGLE_LABELS: Record<string, string> = {
  fear: 'Miedo',
  desire: 'Deseo',
  curiosity: 'Curiosidad',
  social_proof: 'Prueba social',
  urgency: 'Urgencia',
}

const CONFIDENCE_CONFIG = {
  high: { label: 'Alta', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
}

export function InsightExtractor({ insightId, onSave }: ExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractions, setExtractions] = useState<Extraction[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [useAvatarSuggestions, setUseAvatarSuggestions] = useState<Record<number, boolean>>({})

  const handleExtract = async () => {
    setIsExtracting(true)
    setError(null)
    setExtractions([])
    setSelectedItems(new Set())
    setUseAvatarSuggestions({})

    try {
      const res = await fetch(`/api/insights/${insightId}/extract`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al extraer')
      }

      setExtractions(data.extractions || [])
      // Auto-expand first section and auto-enable avatar suggestions for high confidence matches
      setExpandedSections(new Set([0]))
      const autoEnabled: Record<number, boolean> = {}
      data.extractions?.forEach((ext: Extraction, idx: number) => {
        if (ext.avatar_match?.type === 'existing' && ext.avatar_match?.confidence === 'high') {
          autoEnabled[idx] = true
        }
      })
      setUseAvatarSuggestions(autoEnabled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsExtracting(false)
    }
  }

  const toggleItem = (key: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedItems(newSelected)
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const toggleAvatarSuggestion = (extIdx: number) => {
    setUseAvatarSuggestions(prev => ({
      ...prev,
      [extIdx]: !prev[extIdx]
    }))
  }

  const selectAll = () => {
    const allKeys = new Set<string>()
    extractions.forEach((ext, extIdx) => {
      Object.keys(CATEGORY_CONFIG).forEach((catKey) => {
        const items = ext[catKey as keyof typeof CATEGORY_CONFIG] as string[]
        items?.forEach((_, itemIdx) => {
          allKeys.add(`${extIdx}-${catKey}-${itemIdx}`)
        })
      })
    })
    setSelectedItems(allKeys)
  }

  const deselectAll = () => {
    setSelectedItems(new Set())
  }

  const handleSave = async () => {
    const itemsToSave: SavedItem[] = []

    extractions.forEach((ext, extIdx) => {
      const useAvatar = useAvatarSuggestions[extIdx] && ext.avatar_match?.type === 'existing'
      const avatarId = useAvatar ? ext.avatar_match?.existing_avatar_id : null

      Object.entries(CATEGORY_CONFIG).forEach(([catKey, config]) => {
        const items = ext[catKey as keyof typeof CATEGORY_CONFIG] as string[]
        items?.forEach((content, itemIdx) => {
          const key = `${extIdx}-${catKey}-${itemIdx}`
          if (selectedItems.has(key)) {
            itemsToSave.push({
              content,
              category: config.category,
              context: ext.original_text,
              avatarId,
            })
          }
        })
      })
    })

    if (itemsToSave.length === 0) {
      return
    }

    setIsSaving(true)
    try {
      for (const item of itemsToSave) {
        await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'Insight Analysis',
            content: item.content,
            category: item.category,
            context: item.context,
            avatarId: item.avatarId,
          }),
        })
      }

      onSave(itemsToSave)
      setSelectedItems(new Set())
      setExtractions([])
    } catch {
      setError('Error al guardar los elementos')
    } finally {
      setIsSaving(false)
    }
  }

  const renderAvatarMatch = (match: AvatarMatch | undefined, extIdx: number) => {
    if (!match) return null

    const isEnabled = useAvatarSuggestions[extIdx]
    const confidenceConfig = CONFIDENCE_CONFIG[match.confidence]

    if (match.type === 'existing') {
      return (
        <div className={`mt-3 p-3 rounded-lg border transition-all ${isEnabled ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' : 'bg-muted/30 border-transparent'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Avatar detectado:</span>
              <Link
                href={`/research/avatars/${match.existing_avatar_id}`}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                {match.existing_avatar_name}
              </Link>
              <Badge className={`${confidenceConfig.color} text-xs`}>
                {confidenceConfig.label}
              </Badge>
            </div>
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => toggleAvatarSuggestion(extIdx)}
            >
              <LinkIcon className="h-3 w-3 mr-1" />
              {isEnabled ? 'Vinculado' : 'Vincular'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{match.reason}</p>
        </div>
      )
    } else {
      return (
        <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium">Nuevo avatar sugerido:</span>
            <span className="text-sm text-amber-700 dark:text-amber-300">{match.suggested_avatar_name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{match.reason}</p>
          <Link href="/research/avatars/new">
            <Button variant="outline" size="sm" className="mt-2">
              <UserPlus className="h-3 w-3 mr-1" />
              Crear avatar
            </Button>
          </Link>
        </div>
      )
    }
  }

  return (
    <div className="border rounded-lg bg-card mt-6">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="font-medium">Extraer elementos accionables</h3>
          </div>
          <Button
            onClick={handleExtract}
            disabled={isExtracting}
            variant="outline"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analizar con IA
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          La IA analizará tu texto, extraerá elementos accionables y sugerirá avatars
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {extractions.length > 0 && (
        <div className="p-4">
          {/* Selection controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Seleccionar todo
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Deseleccionar
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedItems.size} seleccionados
            </div>
          </div>

          {/* Extractions */}
          <div className="space-y-4">
            {extractions.map((extraction, extIdx) => (
              <div key={extIdx} className="border rounded-lg overflow-hidden">
                {/* Header with original text */}
                <button
                  onClick={() => toggleSection(extIdx)}
                  className="w-full p-3 bg-muted/50 flex items-start justify-between text-left hover:bg-muted transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      &ldquo;{extraction.original_text}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {extraction.suggested_angles?.map((angle) => (
                        <Badge key={angle} variant="secondary" className="text-xs">
                          {ANGLE_LABELS[angle] || angle}
                        </Badge>
                      ))}
                      {extraction.avatar_match?.type === 'existing' && (
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {extraction.avatar_match.existing_avatar_name}
                        </Badge>
                      )}
                      {extraction.avatar_match?.type === 'new' && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Nuevo avatar
                        </Badge>
                      )}
                    </div>
                  </div>
                  {expandedSections.has(extIdx) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Extracted items */}
                {expandedSections.has(extIdx) && (
                  <div className="p-3 space-y-3">
                    {/* Avatar match suggestion */}
                    {renderAvatarMatch(extraction.avatar_match, extIdx)}

                    {Object.entries(CATEGORY_CONFIG).map(([catKey, config]) => {
                      const items = extraction[catKey as keyof typeof CATEGORY_CONFIG] as string[]
                      if (!items || items.length === 0) return null

                      return (
                        <div key={catKey}>
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            {config.label}
                          </div>
                          <div className="space-y-2">
                            {items.map((item, itemIdx) => {
                              const key = `${extIdx}-${catKey}-${itemIdx}`
                              const isSelected = selectedItems.has(key)

                              return (
                                <button
                                  key={key}
                                  onClick={() => toggleItem(key)}
                                  className={`w-full text-left p-2 rounded-lg border transition-all ${
                                    isSelected
                                      ? 'border-primary bg-primary/5'
                                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div
                                      className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center ${
                                        isSelected
                                          ? 'bg-primary border-primary text-primary-foreground'
                                          : 'border-muted-foreground/30'
                                      }`}
                                    >
                                      {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    <div className="flex-1">
                                      <Badge className={`${config.color} text-xs mb-1`}>
                                        {config.label}
                                      </Badge>
                                      <p className="text-sm">{item}</p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save button */}
          {selectedItems.size > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {Object.values(useAvatarSuggestions).some(v => v)
                  ? 'Los elementos se guardarán vinculados a los avatars seleccionados'
                  : 'Los elementos se guardarán como borradores (sin avatar)'}
              </p>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Guardar {selectedItems.size} elementos
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
